require("dotenv").config();

const { BOT_TOKEN } = process.env;

const { Telegraf } = require("telegraf");
const addNewRow = require("./scripts/gSheets");

const { MongoClient } = require("mongodb");
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database Name
const dbName = "cashbox";

// Initialize the sheet - doc ID is the long id in the sheets URL




const recognizeAndAdd = async (number, dateWithZeros, ctx, collection) => {
  if (number[0] == number.match(/[0-9|+]/)) {
    if (number[0] == "+") number = number.slice(1);
    console.log();
    
    await addNewRow(dateWithZeros, number, 1,ctx,collection);
  } else {
    if (number[0] == "-") number = number.slice(1);
    //await addNewRow(dateWithZeros, number, 0);
  }
};

const init = async (bot) => {
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);

  bot.start((ctx) => {
    console.log("1");
  });
  bot.on("message", async (ctx) => {
    //console.log(ctx.message.message_id);
    // try {
    //   await ctx.telegram.copyMessage("290561482", "-1001768035281", 473);
    // } catch (e) {
    //   if (e.message == "400: Bad Request: message to copy not found")
    //     console.log(123);
    // }
    if (ctx.message.text) {
      let text = ctx.message.text;

      //console.log(text.split(/\n/));
      textArr = text.split(/\n/);
      for (let text of textArr) {
        if (text[0].match(/[0-9|+|-]/g) !== null) {
          text = text.replace(/\s/g, "");
          var number = text.match(/[1-9|+|-][0-9]{0,}/g)[0].toString();
          const messageDate = new Date(ctx.message.date * 1000);
          //console.log(ctx.message.chat.id);
          const collection = db.collection(ctx.message.chat.id.toString());

          var dateWithZeros =
            ("0" + messageDate.getDate()).slice(-2) +
            "." +
            ("0" + (messageDate.getMonth() + 1)).slice(-2);
          recognizeAndAdd(number, dateWithZeros, ctx, collection);
        }
      }
    }
  });
  return bot;
};

init(new Telegraf(BOT_TOKEN, { polling: true })).then(async (bot) => {
  await bot.launch();
  console.log(`Launch ${new Date()}`);
});

module.exports = init;
