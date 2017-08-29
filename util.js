// fast, somewhat random number in [0, 10)
// en.wikipedia.org/wiki/Lehmer_random_number_generator
let FAST_RAND = Math.floor(Math.random() * 65537);
function fastRand() {
    FAST_RAND = (75 * FAST_RAND) % 65537;
    return FAST_RAND % 10;
}

function clone_array(a) {
    const b = new Uint8Array(a.length);
    for (let i=0; i<a.length; i++) {
        b[i] = a[i];
    }
    return b;
}