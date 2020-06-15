var aesjs = require('aes-js');

function AESEncrypt(plainText, Base64key) {
    var tmpText = plainText;
    var key = aesjs.utils.utf8.toBytes(Base64key);
    // console.log("ENCRYPT: >> Generate bytekey from text ok.")
    var iv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // cirpherText must be a multiple of 16 bytes
    var plainBytes = aesjs.utils.utf8.toBytes(plainText);
    while(1){
        if (plainBytes.length % 16 == 0) break;
        else {
            tmpText += '\0';
            plainBytes = aesjs.utils.utf8.toBytes(tmpText);
        }
    }
    //console.log("ENCRYPT: >> Generate cirpherBytes ok.");

    // The cipher-block chaining mode of operation maintains internal
    // state, so to decrypt a new instance must be instantiated.
    var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    //console.log("ENCRYPT: >> Create aes module ok.");

    var cipherBytes = aesCbc.encrypt(plainBytes);
    // console.log("ENCRYPT: >> Encrypt ok.");
    // Convert our bytes back into text
    var cipherHexString = aesjs.utils.hex.fromBytes(cipherBytes);
    // console.log("ENCRYPT: >> Convert rs to HexString ok. RS: " + cipherHexString);
    return cipherHexString;
}

function AESDecrypt(cipherHexString, Base64key) {
    var key = aesjs.utils.utf8.toBytes(Base64key);
    var iv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // console.log("DECRYPT: >> Generate bytekey from text ok.");

    var cirpherBytes = aesjs.utils.hex.toBytes(cipherHexString);
    // console.log("DECRYPT: >> Create cirpherBytes ok.");

    // The cipher-block chaining mode of operation maintains internal
    // state, so to decrypt a new instance must be instantiated.
    var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    // console.log("DECRYPT: >> Create AES module ok.");

    var plainBytes = aesCbc.decrypt(cirpherBytes);
    // console.log("DECRYPT: >> Decrypt ok.");

    // Convert our bytes back into text
    var plainText = aesjs.utils.utf8.fromBytes(plainBytes);
    // console.log("DECRYPT: >> Convert rs to UTF8 ok. RS: " + plainText);
    return plainText;
}

function trans(value) {
    if(value) {
        var str = value.toString();
        let size = str.length;
        if (parseInt(value) >= 1000000000) return parseInt(value / 1000000000) + '.' + str.substring(size - 9, size - 6) + '.' + str.substring(size - 6, size - 3) + '.' + str.substring(size - 3, size);
        else if (parseInt(value) >= 1000000) return parseInt(value / 1000000) + '.' + str.substring(size - 6, size - 3) + '.' + str.substring(size - 3, size);
        else if (parseInt(value) >= 1000) return parseInt(value / 1000) + '.' + str.substring(size - 0, size - 3);
        else return value;
    }
}

function parseDate(mathoiky) {
    let mtk = parseInt(mathoiky);
    let mm = mtk % 100;
    let yyyy = parseInt(mtk / 100)
    return mm + '/' + yyyy;
}

export default FunctionStorage = {
    trans: trans,
    AESEncrypt: AESEncrypt,
    AESDecrypt: AESDecrypt,
    parseDate: parseDate
}

