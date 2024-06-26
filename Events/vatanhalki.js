const { Client, Collection, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment');
moment.locale("tr");
const mongoose = require("mongoose");
const { Canvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const statveri = require("./models/stats");
const StaffXP = require("./models/stafxp");
const sunucuayar = require('./models/sunucuayar');
const randMiss = require("./models/randomMission");
const mainSettings = require(__dirname + "/../settings.js");

mongoose.connect(mainSettings.MongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates]
});

client.commands = new Collection();
client.aliases = new Collection();
client.ayarlar = {
  "prefix": mainSettings.prefix,
  "botSesID": mainSettings.botSesID,
  "guildID": mainSettings.guildID,
  "sahip": mainSettings.sahip,
  "commandChannel": mainSettings.commandChannel,
  "footer": mainSettings.footer,
  "onsekizatilacakoda": mainSettings.onsekizatilacakoda,
  "onsekizodalar": mainSettings.onsekizodalar,
  "readyFooter": mainSettings.readyFooter,
  "chatMesajı": mainSettings.chatMesajı,
  "YETKI_VER_LOG": mainSettings.YETKI_VER_LOG,
  "CEZA_PUAN_KANAL": mainSettings.CEZA_PUAN_KANAL,
  "CHAT_KANAL": mainSettings.CHAT_KANAL,
  "PUBLIC_KATEGORI": mainSettings.PUBLIC_KATEGORI,
  "STREAMER_KATEGORI": mainSettings.STREAMER_KATEGORI,
  "REGISTER_KATEGORI": mainSettings.REGISTER_KATEGORI,
  "SLEEP_ROOM": mainSettings.SLEEP_ROOM
}
global.conf = client.ayarlar;

fs.readdir(__dirname + '/komutlar/', (err, files) => {
  if (err) console.error(err);
  console.log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    fs.readdir(__dirname + "/komutlar/" + f, (err2, files2) => {
      files2.forEach(file => {
        let props = require(`./komutlar/${f}/` + file);
        console.log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
          client.aliases.set(alias, props.help.name);
        });
      });
    });
  });
});

const log = message => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
};

client.on('warn', e => {
  console.log(chalk.bgYellow(e));
});

client.on('error', e => {
  console.log(chalk.bgRed(e));
});

client.login(mainSettings.GAME).catch(err => console.log("Token bozulmuş lütfen yeni bir token girmeyi dene"));

let sayi2 = 0;
let kod;

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.channel.id != client.ayarlar.CHAT_KANAL) return;

  let vers = await statveri.findOne({ userID: message.author.id, guildID: message.guild.id });

  sayi2++;

  if (sayi2 === 100) {
    kod = makeid(9);
    let fotolar = [
      "https://cdn.discordapp.com/attachments/820829689248743446/838974840525291550/owsla-kazan.png",
    ];
    let rand = fotolar[Math.floor(Math.random() * fotolar.length)];
    const avatar = await loadImage(message.author.displayAvatarURL({ format: "jpg" }));
    const background = await loadImage(rand);

    const image = new Canvas(640, 320)
      .printImage(background, 0, 0, 640, 320)
      .setTextFont('48px Arial Black')
      .setColor("#fff")
      .printText(`${kod}`, 160, 170);

    const attachment = new AttachmentBuilder(image.toBuffer('image/png'), { name: 'owsla-oyun.png' });

    let verifyMsg = await message.channel.send({ content: "Resimdeki kodu ilk sen yaz ve **25.000** para kazan!", files: [attachment] });

    let filter = m => m.content === kod;
    message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ["time"] })
      .then(async collected => {
        let result = collected.first();
        result.react("✅").catch(err => {
          return undefined;
        });
        sayi2 = 0;
        await statveri.updateOne({ userID: result.author.id, guildID: message.guild.id }, { $inc: { ["para"]: 25000 } }, { upsert: true });
        verifyMsg.edit({ content: new EmbedBuilder().setDescription("Kazanan: <@!" + result.author + "> Tebrikler! **25.000** para kazandın! `.cf - .duello` komutlarını kullanarak paranı katlayabilirsin.").setColor("2F3136") }).catch(err => {
          return undefined;
        });
        setTimeout(() => { verifyMsg.delete() }, 15000);
      })
      .catch(async err => {
        message.channel.send({ content: `Kimse yazmadığı için işlem iptal edildi!` });
        sayi2 = 0;
        verifyMsg.delete().catch(err => {
          return undefined;
        });
      });
  }
});

function makeid(length) {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
}
