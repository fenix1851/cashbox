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

const recognizeAndAdd = async (number, dateWithZeros, ctx, collection, comment) => {
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
    await addNewRow(tableIndex, dateWithZeros, number, 1, ctx, collection, comment);
  } else {
    if (number[0] == "-") number = number.slice(1);
    await addNewRow(tableIndex, dateWithZeros, number, 0, ctx, collection, comment);
  }
};

const update = async (db, ctx, firstChatId, secondChatId) => {
  const collections = await db.collections();
  //console.log(typeof collections)
  for (const coll of collections) {
    const colname = coll.namespace.split(".")[1];
    console.log(
      `colname: ${typeof colname} chatId1: ${typeof firstChatId} chatId2: ${typeof secondChatId}`
    );
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
    //console.log(ctx.message.caption)
    if (ctx.message.text || ctx.message.caption) {
      if(ctx.message.caption){
        console.log(ctx.message.caption);
        var text = ctx.message.caption;
      }
      else if(ctx.message.text){
        console.log(ctx.message.text);
        var text = ctx.message.text;
      }

      //console.log(text.split(/\n/));
      textArr = text.split(/\n/);
      for (let text of textArr) {
        if (text[0].match(/[0-9|+|-]/g) !== null) {
          //console.log(text);
          //console.log(text.split(' '))
          var bufferText = text;
          var ifSpace = false;
          if (text[1] == " ") {
            ifSpace = true;
          }
          //console.log(ifSpace)
          var numberWithSpaces = text.match(/[1-9|+|-][0-9|\s]{1,}/).toString();
          numberWithSpaces = numberWithSpaces.slice(
            0,
            numberWithSpaces.length - 1
          );
          //console.log(numberWithSpaces)
          //console.log(numberWithSpaces)
          // console.log(ifSpace)
          text = text.replace(/\s/g, "");
          //console.log(text)
          var number = text.match(/[1-9|+|-][0-9]{0,}/g)[0].toString();
          var comment = "";
          var bufferNumber = number;
          if (numberWithSpaces != number) {
            console.log("bufferText1: " + bufferText);
            if(numberWithSpaces == number){
              console.log(true)
              bufferText = bufferText.replace(numberWithSpaces, number);
            }

            //console.log(bufferText)
          }
          const splittedText = bufferText.split(" ");
          if (ifSpace) {
            //console.log(number[0]=="-")
            if (number[0] == "-" || number[0] == "+") {
              bufferNumber = number.slice(1);
            }
          }
          for (let i = splittedText.length; i--; i != 0) {
            //console.log(splittedText[0])
            // console.log(splittedText[i]);
            // console.log(bufferNumber);
            if (
              splittedText[i] == bufferNumber ||
              splittedText[i].slice(1) == bufferNumber
            ) {
              break;
            }
            //console.log(splittedText[i]);
            comment = comment + " " + splittedText[i];
            if(splittedText[i] != number){
              console.log('number:'+number);
            }
          }
          comment = comment.split(" ");
          comment = comment.reverse();
          let buffer = "";
          comment.forEach((element) => {
            buffer = buffer + " " + element;
          });
          comment = buffer.slice(1);
          const messageDate = new Date(ctx.message.date * 1000);
          //console.log(ctx.message.chat.id);
          const collection = db.collection(ctx.message.chat.id.toString());

          var dateWithZeros =
            ("0" + messageDate.getDate()).slice(-2) +
            "." +
            ("0" + (messageDate.getMonth() + 1)).slice(-2);
          console.log(`final number: ${number}`)
          console.log(`final comment: ${comment}`);
          await recognizeAndAdd(
            number,
            dateWithZeros,
            ctx,
            collection,
            comment
          );
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
