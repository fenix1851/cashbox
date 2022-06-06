require('dotenv').config();

const { BOT_TOKEN } = process.env;

const {Telegraf} = require("telegraf")

const init = async (bot) =>{
    bot.start(ctx=>{console.log('1')})
    bot.on('message',(ctx)=>{
        if(ctx.message.text[0].match(/[0-9|+|-]/)){
            let text = ctx.message.text
            text = text.replace(/\s/g, '');
            let number = text.match(/[1-9|+|-][0-9]{0,}/);
            ctx.reply(number.toString())
            console.log(number[0][0])
            if (+number[0][0].match[/[1-9|+]/g]) {
              console.log("Plus");
            } else {
              console.log("Minus");
            }

        }

    })
    return bot
}

init(new Telegraf(BOT_TOKEN, { polling: true })).then(async (bot) => {
  await bot.launch();
  console.log(`Launched ${new Date()}`);
});

module.exports = init;