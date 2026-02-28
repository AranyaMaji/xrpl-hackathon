const crypto = require('crypto');
const cc = require('five-bells-condition');

exports.generateEscrowLock = () => {
    const preimageData = crypto.randomBytes(32);
    const fulfillment = new cc.PreimageSha256();
    fulfillment.setPreimage(preimageData);
    return {
        condition: fulfillment
            .getConditionBinary()
            .toString('hex')
            .toUpperCase(),
        fulfillment: fulfillment
            .serializeBinary()
            .toString('hex')
            .toUpperCase(),
    };
};
