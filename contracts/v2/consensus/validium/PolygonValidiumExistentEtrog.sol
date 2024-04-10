// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.20;

import "../../lib/PolygonRollupBaseEtrog.sol";
import "../../interfaces/IDataAvailabilityProtocol.sol";
import "../../interfaces/IPolygonValidium.sol";

/**
 * Contract responsible for managing the states and the updates of L2 network.
 * There will be a trusted sequencer, which is able to send transactions.
 * Any user can force some transaction and the sequencer will have a timeout to add them in the queue.
 * The sequenced state is deterministic and can be precalculated before it's actually verified by a zkProof.
 * The aggregators will be able to verify the sequenced state with zkProofs and therefore make available the withdrawals from L2 network.
 * To enter and exit of the L2 network will be used a PolygonZkEVMBridge smart contract that will be deployed in both networks.
 */
contract PolygonValidiumExistentEtrog is PolygonRollupBaseEtrog, IPolygonValidium {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
   /**
     * @notice Struct which will be used to call sequenceBatches
     * @param transactionsHash keccak256 hash of the L2 ethereum transactions EIP-155 or pre-EIP-155 with signature:
     * EIP-155: rlp(nonce, gasprice, gasLimit, to, value, data, chainid, 0, 0,) || v || r || s
     * pre-EIP-155: rlp(nonce, gasprice, gasLimit, to, value, data) || v || r || s
     * @param forcedGlobalExitRoot Global exit root, empty when sequencing a non forced batch
     * @param forcedTimestamp Minimum timestamp of the force batch data, empty when sequencing a non forced batch
     * @param forcedBlockHashL1 blockHash snapshot of the force batch data, empty when sequencing a non forced batch
     */
    struct ValidiumBatchData {
        bytes32 transactionsHash;
        bytes32 forcedGlobalExitRoot;
        uint64 forcedTimestamp;
        bytes32 forcedBlockHashL1;
    }

    // Data Availability Protocol Address
    IDataAvailabilityProtocol public dataAvailabilityProtocol;

    // Indicates if sequence with data avialability is allowed
    // This allow the sequencer to post the data and skip the Data comittee
    bool public isSequenceWithDataAvailabilityAllowed;

    // Transaction that will be injected as a forced transaction, to setup the timestamp on the state root, we just need a well encoded RLP transaction
    // It's ok if the transaction is not processable
    /* Encoded transaction:
      {
        "from": "0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D",
        "to": "0x4d5Cf5032B2a844602278b01199ED191A86c93ff",
        "nonce": 42,
        "data": "0x",
        "value": "0",
        "gasLimit": 0,
        "gasPrice": "0",
        "chainId": 4242,
        "overwrite": {
          "v": "0x1b",
          "r": "0x00000000000000000000000000000000000000000000000000000005ca1ab1e0",
          "s": "0x00000000000000000000000000000000000000000000000000000005ca1ab1e0"
        }
      }
    */
    bytes public constant SET_UP_ETROG_TX =
        hex"df2a8080944d5cf5032b2a844602278b01199ed191a86c93ff8080821092808000000000000000000000000000000000000000000000000000000005ca1ab1e000000000000000000000000000000000000000000000000000000005ca1ab1e01bff";


    /**
     * @dev Emitted when the admin updates the data availability protocol
     */
    event SetDataAvailabilityProtocol(address newDataAvailabilityProtocol);

    /**
     * @dev Emitted when switch the ability to sequence with data availability
     */
    event SwitchSequenceWithDataAvailability();

    /**
     * @dev Emitted when the system is updated to a etrog using this contract, contain the set up etrog transaction
     */
    event UpdateEtrogSequence(
        uint64 numBatch,
        bytes transactions,
        bytes32 lastGlobalExitRoot,
        address sequencer
    );

    /**
     * @param _globalExitRootManager Global exit root manager address
     * @param _pol POL token address
     * @param _bridgeAddress Bridge address
     * @param _rollupManager Global exit root manager address
     */
    constructor(
        IPolygonZkEVMGlobalExitRootV2 _globalExitRootManager,
        IERC20Upgradeable _pol,
        IPolygonZkEVMBridgeV2 _bridgeAddress,
        PolygonRollupManager _rollupManager
    )
        PolygonRollupBaseEtrog(
            _globalExitRootManager,
            _pol,
            _bridgeAddress,
            _rollupManager
        )
    {}

    /**
     * note This initializer will be called instead of the PolygonRollupBase
     * This is a especial initializer since the zkEVM it's an already created network
     * @param _admin Admin address
     * @param _trustedSequencer Trusted sequencer address
     * @param _trustedSequencerURL Trusted sequencer URL
     * @param _networkName L2 network name
     * @param _lastAccInputHash Acc input hash
     */
    function initializeUpgrade(
        address _admin,
        address _trustedSequencer,
        string memory _trustedSequencerURL,
        string memory _networkName,
        bytes32 _lastAccInputHash
    ) external onlyRollupManager initializer {
        // Set up etrog Tx
        bytes memory transaction = SET_UP_ETROG_TX;
        bytes32 currentTransactionsHash = keccak256(transaction);

        // Get current timestamp and global exit root
        uint64 currentTimestamp = uint64(block.timestamp);
        bytes32 lastGlobalExitRoot = globalExitRootManager
            .getLastGlobalExitRoot();

        // Add the transaction to the sequence as if it was a force transaction
        bytes32 newAccInputHash = keccak256(
            abi.encodePacked(
                _lastAccInputHash, // Last acc Input hash
                currentTransactionsHash,
                lastGlobalExitRoot, // Global exit root
                currentTimestamp,
                _trustedSequencer,
                blockhash(block.number - 1)
            )
        );

        // Set acumulated input hash
        lastAccInputHash = newAccInputHash;

        uint64 currentBatchSequenced = rollupManager.onSequenceBatches(
            uint64(1), // num total batches
            newAccInputHash
        );

        // Set zkEVM variables
        admin = _admin;
        trustedSequencer = _trustedSequencer;

        trustedSequencerURL = _trustedSequencerURL;
        networkName = _networkName;

        forceBatchAddress = _admin;

        // Constant variables
        forceBatchTimeout = 5 days;

        // Both gasTokenAddress and gasTokenNetwork are 0, since it uses ether as gas token
        // Therefore is not necessary to set the variables

        emit UpdateEtrogSequence(
            currentBatchSequenced,
            transaction,
            lastGlobalExitRoot,
            _trustedSequencer
        );
    }

    /////////////////////////////////////
    // Sequence/Verify batches functions
    ////////////////////////////////////

    /**
     * @notice Allows a sequencer to send multiple batches
     * @param batches Struct array which holds the necessary data to append new batches to the sequence
     * @param maxSequenceTimestamp Max timestamp of the sequence. This timestamp must be inside a safety range (actual + 36 seconds).
     * This timestamp should be equal or higher of the last block inside the sequence, otherwise this batch will be invalidated by circuit.
     * @param initSequencedBatch This parameter must match the current last batch sequenced.
     * This will be a protection for the sequencer to avoid sending undesired data
     * @param l2Coinbase Address that will receive the fees from L2
     * @param dataAvailabilityMessage Byte array containing the signatures and all the addresses of the committee in ascending order
     * [signature 0, ..., signature requiredAmountOfSignatures -1, address 0, ... address N]
     * note that each ECDSA signatures are used, therefore each one must be 65 bytes
     * note Pol is not a reentrant token
     */
    function sequenceBatchesValidium(
        ValidiumBatchData[] calldata batches,
        uint64 maxSequenceTimestamp,
        uint64 initSequencedBatch,
        address l2Coinbase,
        bytes calldata dataAvailabilityMessage
    ) external onlyTrustedSequencer {
        uint256 batchesNum = batches.length;
        if (batchesNum == 0) {
            revert SequenceZeroBatches();
        }

        if (batchesNum > _MAX_VERIFY_BATCHES) {
            revert ExceedMaxVerifyBatches();
        }

        // Check max sequence timestamp inside of range
        if (
            uint256(maxSequenceTimestamp) > (block.timestamp + TIMESTAMP_RANGE)
        ) {
            revert MaxTimestampSequenceInvalid();
        }

        // Update global exit root if there are new deposits
        bridgeAddress.updateGlobalExitRoot();

        // Get global batch variables
        bytes32 l1InfoRoot = globalExitRootManager.getRoot();

        // Store storage variables in memory, to save gas, because will be overrided multiple times
        uint64 currentLastForceBatchSequenced = lastForceBatchSequenced;
        bytes32 currentAccInputHash = lastAccInputHash;

        // Store in a temporal variable, for avoid access again the storage slot
        uint64 initLastForceBatchSequenced = currentLastForceBatchSequenced;

        // Accumulated sequenced transaction hash to verify them afterward against the dataAvailabilityProtocol
        bytes32 accumulatedNonForcedTransactionsHash = bytes32(0);

        for (uint256 i = 0; i < batchesNum; i++) {
            // Load current sequence
            ValidiumBatchData memory currentBatch = batches[i];

            // Check if it's a forced batch
            if (currentBatch.forcedTimestamp > 0) {
                currentLastForceBatchSequenced++;

                // Check forced data matches
                bytes32 hashedForcedBatchData = keccak256(
                    abi.encodePacked(
                        currentBatch.transactionsHash,
                        currentBatch.forcedGlobalExitRoot,
                        currentBatch.forcedTimestamp,
                        currentBatch.forcedBlockHashL1
                    )
                );

                if (
                    hashedForcedBatchData !=
                    forcedBatches[currentLastForceBatchSequenced]
                ) {
                    revert ForcedDataDoesNotMatch();
                }

                // Calculate next accumulated input hash
                currentAccInputHash = keccak256(
                    abi.encodePacked(
                        currentAccInputHash,
                        currentBatch.transactionsHash,
                        currentBatch.forcedGlobalExitRoot,
                        currentBatch.forcedTimestamp,
                        l2Coinbase,
                        currentBatch.forcedBlockHashL1
                    )
                );

                // Delete forceBatch data since won't be used anymore
                delete forcedBatches[currentLastForceBatchSequenced];
            } else {
                // Accumulate non forced transactions hash
                accumulatedNonForcedTransactionsHash = keccak256(
                    abi.encodePacked(
                        accumulatedNonForcedTransactionsHash,
                        currentBatch.transactionsHash
                    )
                );

                // Note that forcedGlobalExitRoot and forcedBlockHashL1 remain unused and unchecked in this path
                // The synchronizer should be aware of that

                // Calculate next accumulated input hash
                currentAccInputHash = keccak256(
                    abi.encodePacked(
                        currentAccInputHash,
                        currentBatch.transactionsHash,
                        l1InfoRoot,
                        maxSequenceTimestamp,
                        l2Coinbase,
                        bytes32(0)
                    )
                );
            }
        }

        // Sanity check, should be unreachable
        if (currentLastForceBatchSequenced > lastForceBatch) {
            revert ForceBatchesOverflow();
        }

        // Store back the storage variables
        lastAccInputHash = currentAccInputHash;

        uint256 nonForcedBatchesSequenced = batchesNum;

        // Check if there has been forced batches
        if (currentLastForceBatchSequenced != initLastForceBatchSequenced) {
            uint64 forcedBatchesSequenced = currentLastForceBatchSequenced -
                initLastForceBatchSequenced;
            // substract forced batches
            nonForcedBatchesSequenced -= forcedBatchesSequenced;

            // Transfer pol for every forced batch submitted
            pol.safeTransfer(
                address(rollupManager),
                calculatePolPerForceBatch() * (forcedBatchesSequenced)
            );

            // Store new last force batch sequenced
            lastForceBatchSequenced = currentLastForceBatchSequenced;
        }

        // Pay collateral for every non-forced batch submitted
        if (nonForcedBatchesSequenced != 0) {
            pol.safeTransferFrom(
                msg.sender,
                address(rollupManager),
                rollupManager.getBatchFee() * nonForcedBatchesSequenced
            );

            // Validate that the data availability protocol accepts the dataAvailabilityMessage
            // note This is a view function, so there's not much risk even if this contract was vulnerable to reentrant attacks
            dataAvailabilityProtocol.verifyMessage(
                accumulatedNonForcedTransactionsHash,
                dataAvailabilityMessage
            );
        }

        uint64 currentBatchSequenced = rollupManager.onSequenceBatches(
            uint64(batchesNum),
            currentAccInputHash
        );

        // Check init sequenced batch
        if (
            initSequencedBatch != (currentBatchSequenced - uint64(batchesNum))
        ) {
            revert InitSequencedBatchDoesNotMatch();
        }

        emit SequenceBatches(currentBatchSequenced, l1InfoRoot);
    }

    /**
     * @notice Allows a sequencer to send multiple batches
     * @param batches Struct array which holds the necessary data to append new batches to the sequence
     * @param maxSequenceTimestamp Max timestamp of the sequence. This timestamp must be inside a safety range (actual + 36 seconds).
     * This timestamp should be equal or higher of the last block inside the sequence, otherwise this batch will be invalidated by circuit.
     * @param initSequencedBatch This parameter must match the current last batch sequenced.
     * This will be a protection for the sequencer to avoid sending undesired data
     * @param l2Coinbase Address that will receive the fees from L2
     * note Pol is not a reentrant token
     */
    function sequenceBatches(
        BatchData[] calldata batches,
        uint64 maxSequenceTimestamp,
        uint64 initSequencedBatch,
        address l2Coinbase
    ) public override {
        if (!isSequenceWithDataAvailabilityAllowed) {
            revert SequenceWithDataAvailabilityNotAllowed();
        }
        super.sequenceBatches(
            batches,
            maxSequenceTimestamp,
            initSequencedBatch,
            l2Coinbase
        );
    }

    //////////////////
    // admin functions
    //////////////////

    /**
     * @notice Allow the admin to set a new data availability protocol
     * @param newDataAvailabilityProtocol Address of the new data availability protocol
     */
    function setDataAvailabilityProtocol(
        IDataAvailabilityProtocol newDataAvailabilityProtocol
    ) external onlyAdmin {
        dataAvailabilityProtocol = newDataAvailabilityProtocol;

        emit SetDataAvailabilityProtocol(address(newDataAvailabilityProtocol));
    }

    /**
     * @notice Allow the admin to switch the sequence with data availability
     * @param newIsSequenceWithDataAvailabilityAllowed Boolean to switch
     */
    function switchSequenceWithDataAvailability(
        bool newIsSequenceWithDataAvailabilityAllowed
    ) external onlyAdmin {
        if (
            newIsSequenceWithDataAvailabilityAllowed ==
            isSequenceWithDataAvailabilityAllowed
        ) {
            revert SwitchToSameValue();
        }
        isSequenceWithDataAvailabilityAllowed = newIsSequenceWithDataAvailabilityAllowed;
        emit SwitchSequenceWithDataAvailability();
    }

}
