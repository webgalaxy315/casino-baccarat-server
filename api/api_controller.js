const axios = require("axios");
const rand = require("random-seed").create();
require("dotenv").config();

const getArray = (num, max) => {
    let array = [];
    for (let i = 0; i < num;) {
        let random = rand.intBetween(0, max - 1);
        if (array.indexOf(random) == -1) {
            i++;
            array.push(random);
        }
        continue;
    }
    return array;
}
const getSum = (poker, num) => {
    let Sum = 0;
    for (let i = 0; i < num; i++) {
        let value = poker[i] % 13 + 1;
        if (value == 13 || value == 10 || value == 11 || value == 12) {
            value = 0;
        } else {
            Sum += value;
        }
    }
    return Sum % 10;
}
const get_Array1 = (num1, num2, poker) => {
    let array = [];
    for (let i = 0; i < num1 + 2;) {
        let random = rand.intBetween(0, num1 + num2 + 3);
        if (array.indexOf(poker[random]) != -1) {
            continue;
        }
        i++
        array.push(poker[random]);
    }
    return array;
}
const get_Array2 = (num1, num2, poker, poker1) => {
    let array = [];
    for (let i = 0; i < num1 + 2;) {
        let random = rand.intBetween(0, num1 + num2 + 3);
        if (array.indexOf(poker[random]) == -1 && poker1.indexOf(poker[random]) == -1) {
            array.push(poker[random]);
            i++
        }
        continue;
    }
    return array;
}
const getPokerArray = (poker, num) => {
    let array = [];
    for (let i = 0; i < num; i++) {
        array.push(poker[i] % 13);
        array.push(parseInt(poker[i] / 13));
    }
    return array;
}

const Compare = (poker1_sum, poker2_sum) => {
    let reward = 0;
    if (poker1_sum > poker2_sum) {
        reward = 2;
    } else if (poker1_sum < poker2_sum) {
        reward = 0;
    } else if (poker1_sum == poker2_sum) {
        reward = 1;
    }
    return reward;
}

const getAmount = (reward, betAmount, p_amount, t_amount, b_amount, random) => {
    let earnAmount = 0;
    if (reward == 0) {
        earnAmount = 1.95 * b_amount;
    } else if (reward == 1) {
        if (t_amount > 0) {
            earnAmount = betAmount * random;
        } else {
            earnAmount = 0;
        }
    } else {
        earnAmount = p_amount * reward;
    }
    return earnAmount;
}

module.exports = {
    BET: async (req, res) => {
        try {
            let users = [];
            let earnAmount = 0;

            const { token, betAmount, player_mark, tie_mark, banker_mark } = req.body;

            const bet_Amount = parseFloat(betAmount);
            const player_Amount = parseFloat(player_mark);
            const tie_Amount = parseFloat(tie_mark);
            const banker_Amount = parseFloat(banker_mark);

            users[token] = {
                token: token,
                betAmount: bet_Amount,
                tieAmount: tie_Amount,
                playerAmount: player_Amount,
                bankerAmount: banker_Amount
            }
            try {
                await axios.post(process.env.PLATFORM_SERVER + "api/games/bet", {
                    token: users[token].token,
                    amount: users[token].betAmount
                });
            } catch (err) {
                throw new Error("BET ERROR!");
            }

            try {
                let poker1_thing = await rand.intBetween(0, 1);
                let poker2_thing = await rand.intBetween(0, 1);

                let poker_array = await getArray((poker1_thing + poker2_thing + 4), 52);

                let poker1_mark = await get_Array1(poker1_thing, poker2_thing, poker_array);
                let poker2_mark = await get_Array2(poker2_thing, poker1_thing, poker_array, poker1_mark);

                let poker1_sum = await getSum(poker1_mark, (poker1_thing + 2));
                let poker2_sum = await getSum(poker2_mark, (poker2_thing + 2));

                let poker1 = await getPokerArray(poker1_mark, (poker1_thing + 2));
                let poker2 = await getPokerArray(poker2_mark, (poker2_thing + 2));

                let reward = await Compare(poker1_sum, poker2_sum);
                let tie_random = rand.intBetween(1, 8);

                earnAmount = await getAmount(reward, users[token].betAmount, users[token].playerAmount, users[token].tieAmount, users[token].bankerAmount, tie_random);

                res.json({
                    reward: reward,
                    player: poker1,
                    banker: poker2,
                    player_sum: poker1_sum,
                    banker_sum: poker2_sum,
                    earnAmount: earnAmount,
                    tie_random: tie_random,
                    Message: "SUCCESS!"
                })

            } catch (err) {
                throw new Error("DATA ERROR!");
            }
            try {
                await axios.post(process.env.PLATFORM_SERVER + "api/games/winlose", {
                    token: users[token].token,
                    amount: earnAmount,
                    winState: earnAmount > 0 ? true : false
                });
            } catch (err) {
                throw new Error("SERVER ERROR!");
            }
        } catch (err) {
            res.json({

                Message: err.message
            });
        }
    },
};
