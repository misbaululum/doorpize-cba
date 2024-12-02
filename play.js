var startSeqs = {};
var startNum = 0;

// jQuery FN
$.fn.playSpin = function (options) {
    if (this.length) {
        if ($(this).is(':animated')) return; // Return false if this element is animating
        startSeqs['mainSeq' + (++startNum)] = {};
        $(this).attr('data-playslot', startNum);

        var total = this.length;
        var thisSeq = 0;

        // Initialize options
        if (typeof options == 'undefined') {
            options = new Object();
        }

        // Pre-define end nums
        var endNums = [];
        for (var i = 0; i < total; i++) {
            endNums.push(-1); // Initialize with -1 to indicate unassigned
        }

        startSeqs['mainSeq' + startNum]['totalSpinning'] = total;
        return this.each(function () {
            if (thisSeq === 0) {
                // Generate the first digit (0 or 1)
                options.endNum = Math.floor(Math.random() * 2); // Hanya 0 atau 1 untuk digit pertama
            } else {
                // Generate unique numbers for other digit places
                options.endNum = generateUniqueEndNum(endNums, thisSeq);
            }
            startSeqs['mainSeq' + startNum]['subSeq' + (++thisSeq)] = {};
            startSeqs['mainSeq' + startNum]['subSeq' + thisSeq]['spinning'] = true;
            var track = {
                total: total,
                mainSeq: startNum,
                subSeq: thisSeq
            };
            (new slotMachine(this, options, track));
        });
    }
};

// Function to generate unique end numbers across digit places
function generateUniqueEndNum(existingNums, index) {
    let newNum;
    do {
        newNum = Math.floor(Math.random() * 10); // Generate a number between 0 and 9
    } while (existingNums.includes(newNum)); // Ensure it's unique
    existingNums[index] = newNum; // Add to existing numbers
    return newNum;
}

// Function to generate a complete random number
function generateCompleteRandomNumber() {
    let digits = [];
    // First digit (0 or 1)
    digits.push(Math.floor(Math.random() * 2)); // 0 or 1

    // Next three digits (0-9)
    for (let i = 0; i < 3; i++) {
        let newDigit;
        do {
            newDigit = Math.floor(Math.random() * 10); // 0-9
        } while (digits.includes(newDigit)); // Ensure uniqueness
        digits.push(newDigit);
    }

    return parseInt(digits.join(''), 10); // Join and convert to number
}

// Reset initial state to `0000`
function resetToInitialState(selector) {
    $(selector).each(function () {
        const $this = $(this);
        $this.find('li').each(function (index) {
            $(this).text(index); // Isi angka 0-9 sesuai posisi
        });
    });
}

// Slot machine function
var slotMachine = function (el, options, track) {
    var slot = this;
    slot.$el = $(el);

    slot.defaultOptions = {
        easing: 'swing',
        time: 5000,
        loops: 10,
        manualStop: false,
        useStopTime: false,
        stopTime: 5000,
        stopSeq: 'random',
        endNum: 0,
        onEnd: $.noop,
        onFinish: $.noop,
    };

    slot.spinSpeed = 0;
    slot.loopCount = 0;

    slot.init = function () {
        slot.options = $.extend({}, slot.defaultOptions, options);
        slot.setup();
        slot.startSpin();
    };

    slot.setup = function () {
        var $li = slot.$el.find('li').first();
        slot.liHeight = $li.innerHeight();
        slot.liCount = slot.$el.children().length;
        slot.listHeight = slot.liHeight * slot.liCount;
        slot.spinSpeed = slot.options.time / slot.options.loops;

        $li.clone().appendTo(slot.$el); // Clone to last row for smooth animation

        if (slot.options.stopSeq == 'leftToRight') {
            if (track.subSeq != 1) {
                slot.options.manualStop = true;
            }
        } else if (slot.options.stopSeq == 'rightToLeft') {
            if (track.total != track.subSeq) {
                slot.options.manualStop = true;
            }
        }
    };

    slot.startSpin = function () {
        slot.$el
            .css('top', -slot.listHeight)
            .animate({ 'top': '0px' }, slot.spinSpeed, 'linear', function () {
                slot.lowerSpeed();
            });
    };

    slot.lowerSpeed = function () {
        slot.loopCount++;

        if (
            slot.loopCount < slot.options.loops ||
            (slot.options.manualStop && startSeqs['mainSeq' + track.mainSeq]['subSeq' + track.subSeq]['spinning'])
        ) {
            slot.startSpin();
        } else {
            slot.endSpin();
        }
    };

    slot.endSpin = function () {
        if (slot.options.endNum == 0) {
            slot.options.endNum = generateCompleteRandomNumber(); // Generate a complete random number
        }

        if (slot.options.endNum < 0 || slot.options.endNum > slot.liCount) {
            slot.options.endNum = 1;
        }

        var finalPos = -((slot.liHeight * slot.options.endNum) - slot.liHeight);
        var finalTime = ((slot.spinSpeed * 1.5) * slot.liCount) / slot.options.endNum;
        if (slot.options.useStopTime) {
            finalTime = slot.options.stopTime;
        }

        slot.$el
            .css('top', -slot.listHeight)
            .animate({ 'top': finalPos }, parseInt(finalTime), slot.options.easing, function () {
                slot.$el.find('li').last().remove();
                slot.endAnimation(slot.options.endNum);
                if ($.isFunction(slot.options.onEnd)) {
                    slot.options.onEnd(slot.options.endNum);
                }

                if (startSeqs['mainSeq' + track.mainSeq]['totalSpinning'] == 0) {
                    var totalNum = '';
                    $.each(startSeqs['mainSeq' + track.mainSeq], function (index, subSeqs) {
                        if (typeof subSeqs == 'object') {
                            totalNum += subSeqs['endNum'].toString();
                        }
                    });
                    console.log('Final Results:', totalNum);
                    if ($.isFunction(slot.options.onFinish)) {
                        slot.options.onFinish(totalNum);
                    }
                }
            });
    };

    slot.endAnimation = function (endNum) {
        if (slot.options.stopSeq == 'leftToRight' && track.total != track.subSeq) {
            startSeqs['mainSeq' + track.mainSeq]['subSeq' + (track.subSeq + 1)]['spinning'] = false;
        } else if (slot.options.stopSeq == 'rightToLeft' && track.subSeq != 1) {
            startSeqs['mainSeq' + track.mainSeq]['subSeq' + (track.subSeq - 1)]['spinning'] = false;
        }
        startSeqs['mainSeq' + track.mainSeq]['totalSpinning']--;
        startSeqs['mainSeq' + track.mainSeq]['subSeq' + track.subSeq]['endNum'] = endNum;
    };

    slot.randomRange = function (low, high) {
        return Math.floor(Math.random() * (1 + high - low)) + low;
    };

    this.init();
};

// Example usage with reset
$(document).ready(function () {
    resetToInitialState('#example1 ul'); // Reset all slot elements to start from `0000`

    $('#btn-example1').click(function () {
        $('#example1 ul').playSpin({
            loops: 10, // jumlah putaran
            time: 5000, // durasi animasi
            stopSeq: 'leftToRight', // menghentikan secara berurutan dari kiri ke kanan
        });
    });
});
