require('dotenv').config();

const {GOOGLE_TOKEN} = process.env
const {GOOGLE_SERVICE_ACCOUNT_EMAIL} = process.env
const {TABLE_ID} = process.env


const { GoogleSpreadsheet } = require('google-spreadsheet');

const doc = new GoogleSpreadsheet(
  TABLE_ID
);

const addNewRow = async (tableIndex, date, summ, sign,ctx, collection, comment) => {
    await doc.useServiceAccountAuth({
      // env var values are copied from service account credentials generated by google
      // see "Authentication" section in docs for more info
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_TOKEN.replace(/(\\r)|(\\n)/g, "\n"),
    });
    await doc.loadInfo();
    //console.log(tableIndex)
    const sheet = doc.sheetsByIndex[tableIndex];
    if(sign){
        await sheet.addRow({ Дата: date, Приход: summ, Комментарии: comment });
        let rows = await sheet.getRows();
        let rowNumber = rows[rows.length - 1]["_rowNumber"];
       // await collection.insertOne({
         // messageId: ctx.message.message_id,
          //date: date,
          //number: summ,
          //sign: sign,
          //row: rowNumber,
          //comment: comment
        //});
        ctx.reply('Приход '+summ+' зафиксирован')
    }
    else{
        await sheet.addRow({ Дата: date, Расход: summ, Комментарии: comment });
        let rows = await sheet.getRows();
        let rowNumber = rows[rows.length - 1]["_rowNumber"];
        //await collection.insertOne({
          //messageId: ctx.message.message_id,
          //date: date,
          //number: summ,
          //row: rowNumber,
        //});
        ctx.reply("Расход " + summ + " зафиксирован");
    }
}

const deleteRow = async (tableIndex,rowNumber, db, colname, objectId)=>{
  await doc.useServiceAccountAuth({
    // env var values are copied from service account credentials generated by google
    // see "Authentication" section in docs for more info
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_TOKEN.replace(/(\\r)|(\\n)/g, "\n"),
  });
  console.log(tableIndex)
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[tableIndex];
  const cells = await sheet.loadCells(`A${rowNumber}:D${rowNumber}`);
  const cellA = sheet.getCellByA1(`A${rowNumber}`)
  const cellB = sheet.getCellByA1(`B${rowNumber}`);
  const cellC = sheet.getCellByA1(`C${rowNumber}`);
  const cellD = sheet.getCellByA1(`D${rowNumber}`);

  //const collection = db.collection(colname);
  if (
    cellA._rawData.formattedValue &&
    cellA._rawData.formattedValue != "[ДАННЫЕ УДАЛЕНЫ]"
  ) {
    cellA.value = "[ДАННЫЕ УДАЛЕНЫ]";
    cellB.value = "";
    cellC.value = "";
    cellD.value = "";

    await sheet.saveUpdatedCells();
    console.log(`row ${rowNumber} deleted`);
    // const deleteResult = await collection.deleteMany({ _id: objectId });
    // console.log(`deleted: ${deleteResult}`);
  } else {
    console.log(
      `error, row ${rowNumber} in ${tableIndex} table doesn't founded`
    );
  }
}

const test = async() =>{
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_TOKEN.replace(/(\\r)|(\\n)/g, "\n"),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[1];
    const rows = await sheet.getRows();
    await sheet.addRow({ A: 1, C: 2 });
    console.log(rows[rows.length - 1]["_rowNumber"]);
}
//test()
module.exports = {addNewRow, deleteRow};
// addNewRow("06.08", 24350, "minus");


