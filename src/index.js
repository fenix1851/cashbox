require('dotenv').config();

const { BOT_TOKEN } = process.env;

const {Telegraf} = require("telegraf")

const init = async (bot) =>{
    bot.start(ctx=>{console.log('1')})
    bot.on('message',(ctx)=>{
      if(ctx.message.text){
        let text = ctx.message.text;

        //console.log(text.split(/\n/));
        textArr = text.split(/\n/)
        for (let text of textArr) {
          if (text[0].match(/[0-9|+|-]/g) !== null) {
            text = text.replace(/\s/g, "");
            let number = text.match(/[1-9|+|-][0-9]{0,}/g)[0].toString();
            //ctx.reply(number.match(/[0-9|+]/g));
            //console.log(number.match(/[0-9|+]/).toString());
            if (number[0] == number.match(/[0-9|+]/)) {
              console.log("Plus");
              if (number[0] == "+") number = number.slice(1);
              console.log(number);
            } else {
              console.log("Minus");
              console.log(number);
            }
          }   
        }
    }
    })
    return bot
}

init(new Telegraf(BOT_TOKEN, { polling: true })).then(async (bot) => {
  await bot.launch();
  console.log(`Launch ${new Date()}`);
});

module.exports = init;