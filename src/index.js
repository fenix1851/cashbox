process
  .on("unhandledRejection", (reason, p) => {
    console.log(`Unhandled Rejection at Promise: ${reason}`);
  })
  .on("uncaughtException", (err) => {
    console.log(`Uncaught Exception thrown: ${err}`);
  });

require("dotenv").config();

const { BOT_TOKEN } = process.env;

const { Telegraf } = require("telegraf");
const { addNewRow } = require("./scripts/gSheets");
const { deleteRow } = require("./scripts/gSheets");

//const {deleteRow} = require('./scripts/gSheets')

const { MongoClient } = require("mongodb");
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database Name
const dbName = "cashbox";

// Initialize the sheet - doc ID is the long id in the sheets URL
const { firstChatId } = process.env;
const { secondChatId } = process.env;

const recognizeAndAdd = async (number, dateWithZeros, ctx, collection) => {
  let tableIndex = 2;
  if (ctx.message.chat.id) {
    //console.log(ctx.message.chat.id);
    switch (ctx.message.chat.id.toString()) {
      case firstChatId:
        tableIndex = 0;
        break;
      case secondChatId:
        tableIndex = 1;
    }
  }
  if (number[0] == number.match(/[0-9|+]/)) {
    if (number[0] == "+") number = number.slice(1);
    console.log();
    await addNewRow(tableIndex, dateWithZeros, number, 1, ctx, collection);
  } else {
    if (number[0] == "-") number = number.slice(1);
    await addNewRow(tableIndex, dateWithZeros, number, 0, ctx, collection);
  }
};

const update = async (db, ctx, firstChatId, secondChatId) => {
  const collections = await db.collections();
  //console.log(typeof collections)
  for (const coll of collections) {
    const colname = coll.namespace.split(".")[1];
    const collection = db.collection(colname);
    const elements = await collection.find().toArray();
    //console.log(data)
    for (const elem of elements) {
      // console.log("-------------------");
      // console.log(elem);
      try {
        await ctx.telegram.copyMessage("290561482", colname, elem.messageId);
      } catch (e) {
        if (e.message == "400: Bad Request: message to copy not found")
          console.log(elem._id);
        console.log(colname == secondChatId);
        if (colname == firstChatId) {
          console.log("first delete");
          await deleteRow(0, elem.row, db, colname, elem._id);
        } else if (colname == secondChatId) {
          console.log("second delete");
          await deleteRow(1, elem.row, db, colname, elem._id);
        } else {
          console.log("dont find such table");
        }
      }
    }
  }
  //console.log(ctx.message.message_id);
};

const init = async (bot) => {
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  bot.start((ctx) => {
    console.log(ctx.chat)
  });

  bot.command("update", (ctx) => {
    update(db, ctx, firstChatId, secondChatId);
  });

  bot.on("message", async (ctx) => {
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
