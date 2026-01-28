// Minimal SHA-256 implementation for cross-platform support (Web & RN)
// Source: Adaptation of common JS SHA256 libraries

export async function sha256(ascii: string): Promise<string> {
    function rightRotate(value: number, amount: number) {
        return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var result = ''

    var words: number[] = [];
    var asciiBitLength = ascii.length * 8;

    var hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19] as number[];
    var k = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

    var i, j, w: number[] = [], rr: number[] = [];
    var prime = 0;

    for (i = 0; i < ascii.length; i++) {
        j = (i >> 2) & 3; // 0,1,2,3
        var bitOffset = (3 - j) * 8;
        if (words[i >> 2] === undefined) words[i >> 2] = 0;
        words[i >> 2] |= ascii.charCodeAt(i) << bitOffset;
    }

    var end = (ascii.length >> 2);
    if (words[end] === undefined) words[end] = 0;
    words[end] |= 0x80 << ((3 - (ascii.length & 3)) * 8);

    words[((ascii.length + 8) >> 6) * 16 + 15] = asciiBitLength;

    for (i = 0; i < words.length; i += 16) {
        var h0 = hash[0], h1 = hash[1], h2 = hash[2], h3 = hash[3], h4 = hash[4], h5 = hash[5], h6 = hash[6], h7 = hash[7];

        for (j = 0; j < 64; j++) {
            if (j < 16) {
                w[j] = words[j + i] || 0;
            } else {
                var gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
                var gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
                w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0; // overflow is logic in JS
            }

            var s0 = rightRotate(h0, 2) ^ rightRotate(h0, 13) ^ rightRotate(h0, 22);
            var maj = (h0 & h1) ^ (h0 & h2) ^ (h1 & h2);
            var t2 = (s0 + maj) | 0;
            var s1 = rightRotate(h4, 6) ^ rightRotate(h4, 11) ^ rightRotate(h4, 25);
            var ch = (h4 & h5) ^ ((~h4) & h6);
            var t1 = (h7 + s1 + ch + k[j] + w[j]) | 0;

            h7 = h6;
            h6 = h5;
            h5 = h4;
            h4 = (h3 + t1) | 0;
            h3 = h2;
            h2 = h1;
            h1 = (h0 + t1) | 0;
            h0 = (t1 + t2) | 0;
        }

        hash[0] = (hash[0] + h0) | 0;
        hash[1] = (hash[1] + h1) | 0;
        hash[2] = (hash[2] + h2) | 0;
        hash[3] = (hash[3] + h3) | 0;
        hash[4] = (hash[4] + h4) | 0;
        hash[5] = (hash[5] + h5) | 0;
        hash[6] = (hash[6] + h6) | 0;
        hash[7] = (hash[7] + h7) | 0;
    }

    for (i = 0; i < 8; i++) {
        var val = hash[i];
        // Convert to hex
        for (j = 0; j < 4; j++) {
            var b = (val >>> (24 - j * 8)) & 0xff;
            result += b.toString(16).padStart(2, '0');
        }
    }
    return result;
}
