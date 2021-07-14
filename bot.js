const Discord = require("discord.js"); //Kurallar
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const moment = require("moment");
const { Client, Util } = require("discord.js");
const fs = require("fs");
const db = require("quick.db");
const http = require("http");
const express = require("express");
require("./util/eventLoader.js")(client);
const path = require("path");
const kontrol = require("node-fetch");
const { GiveawaysManager } = require("discord-giveaways");
const snekfetch = require("snekfetch");

const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + "yeniden bağlandım kral");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("MANAGE_MESSAGES")) permlvl = 1;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});
////////////////////////////////////////////////////////////////////////////////////////////////

client.login(process.env.token);

///////////////////////////////////////////////////////////////////////////////////////////////

client.on("message", async message => {
  const Bdgo = message.content.toLocaleLowerCase();

  if (
    Bdgo === "selam" ||
    Bdgo === "sa" ||
    Bdgo === "selamün aleyküm" ||
    Bdgo === "selamun aleyküm" ||
    Bdgo === "merhaba" ||
    Bdgo === "mrb" ||
    Bdgo === "slm" ||
    Bdgo === "Sa" ||
    Bdgo === "sea"
  ) {
    let e = await db.fetch(`sa-as_${message.guild.id}`);
    if (e === "acik") {
      const embed = new Discord.MessageEmbed()

        .setDescription(`Aleyküm Selam, Hoş Geldin <a:el:847897239259185182> `)
        .setColor("BLUE");

      return message.channel.send(embed);
    }
  }
});
////

const ms = require("parse-ms");
const { DiscordAPIError } = require("discord.js");

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.content.includes(`afk`)) return;

  if (await db.fetch(`afk_${message.author.id}`)) {
    db.delete(`afk_${message.author.id}`);
    db.delete(`afk_süre_${message.author.id}`);

    const embed = new Discord.MessageEmbed()

      .setColor("GREEN")
      .setAuthor(message.author.username, message.author.avatarURL)
      .setDescription(`Afk Modundan Başarıyla Çıkıldı.`);

    message.channel.send(embed);
  }

  var USER = message.mentions.users.first();
  if (!USER) return;
  var REASON = await db.fetch(`afk_${USER.id}`);

  if (REASON) {
    let süre = await db.fetch(`afk_süre_${USER.id}`);
    let timeObj = ms(Date.now() - süre);

    const afk = new Discord.MessageEmbed()

      .setColor("RED")
      .setDescription(
        `**BU KULLANICI AFK**\n\n**Afk Olan Kullanıcı :** \`${USER.tag}\`\n**Afk Süresi :** \`${timeObj.hours}saat\` \`${timeObj.minutes}dakika\` \`${timeObj.seconds}saniye\`\n**Sebep :** \`${REASON}\``
      );

    message.channel.send(afk);
  }
});

///////////////////////////////////////MODLOG SİSTEM MODLOG//////////////////////////////////////

client.on("messageDelete", async message => {
  if (message.author.bot || message.channel.type == "dm") return;

  let log = message.guild.channels.cache.get(
    await db.fetch(`log_${message.guild.id}`)
  );

  if (!log) return;

  const embed = new Discord.MessageEmbed()

    .setTitle(message.author.username + " | Mesaj Silindi")

    .addField("Kullanıcı: ", message.author)

    .addField("Kanal: ", message.channel)

    .addField("Mesaj: ", "" + message.content + "");

  log.send(embed);
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  let modlog = await db.fetch(`log_${oldMessage.guild.id}`);

  if (!modlog) return;

  let embed = new Discord.MessageEmbed()

    .setAuthor(oldMessage.author.username, oldMessage.author.avatarURL())

    .addField("**Eylem:**", "Mesaj Düzenleme")

    .addField(
      "**Mesajın sahibi:**",
      `<@${oldMessage.author.id}> === **${oldMessage.author.id}**`
    )

    .addField("**Eski Mesajı:**", `${oldMessage.content}`)

    .addField("**Yeni Mesajı:**", `${newMessage.content}`)

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(
      `Sunucu: ${oldMessage.guild.name} - ${oldMessage.guild.id}`,
      oldMessage.guild.iconURL()
    )

    .setThumbnail(oldMessage.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("channelCreate", async channel => {
  let modlog = await db.fetch(`log_${channel.guild.id}`); //otorol

  if (!modlog) return;

  const entry = await channel.guild
    .fetchAuditLogs({ type: "CHANNEL_CREATE" })
    .then(audit => audit.entries.first());

  let kanal;

  if (channel.type === "text") kanal = `<#${channel.id}>`;

  if (channel.type === "voice") kanal = `\`${channel.name}\``;

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Kanal Oluşturma")

    .addField("**Kanalı Oluşturan Kişi:**", `<@${entry.executor.id}>`)

    .addField("**Oluşturduğu Kanal:**", `${kanal}`)

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(
      `Sunucu: ${channel.guild.name} - ${channel.guild.id}`,
      channel.guild.iconURL()
    )

    .setThumbnail(channel.guild.iconUR);

  client.channels.cache.get(modlog).send(embed);
});

client.on("channelDelete", async channel => {
  let modlog = await db.fetch(`log_${channel.guild.id}`);

  if (!modlog) return;

  const entry = await channel.guild
    .fetchAuditLogs({ type: "CHANNEL_DELETE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Kanal Silme")

    .addField("**Kanalı Silen Kişi:**", `<@${entry.executor.id}>`)

    .addField("**Silinen Kanal:**", `\`${channel.name}\``)

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(
      `Sunucu: ${channel.guild.name} - ${channel.guild.id}`,
      channel.guild.iconURL()
    )

    .setThumbnail(channel.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("roleCreate", async role => {
  let modlog = await db.fetch(`log_${role.guild.id}`);

  if (!modlog) return;

  const entry = await role.guild
    .fetchAuditLogs({ type: "ROLE_CREATE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Rol Oluşturma")

    .addField("**Rolü oluşturan kişi:**", `<@${entry.executor.id}>`)

    .addField("**Oluşturulan rol:**", `\`${role.name}\` **=** \`${role.id}\``)

    .setTimestamp()

    .setFooter(
      `Sunucu: ${role.guild.name} - ${role.guild.id}`,
      role.guild.iconURL
    )

    .setColor(0x36393f)

    .setThumbnail(role.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("roleDelete", async role => {
  let modlog = await db.fetch(`log_${role.guild.id}`);

  if (!modlog) return;

  const entry = await role.guild
    .fetchAuditLogs({ type: "ROLE_DELETE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Rol Silme")

    .addField("**Rolü silen kişi:**", `<@${entry.executor.id}>`)

    .addField("**Silinen rol:**", `\`${role.name}\` **=** \`${role.id}\``)

    .setTimestamp()

    .setFooter(
      `Sunucu: ${role.guild.name} - ${role.guild.id}`,
      role.guild.iconURL
    )

    .setColor(0x36393f)

    .setThumbnail(role.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("emojiCreate", async emoji => {
  let modlog = await db.fetch(`log_${emoji.guild.id}`);

  if (!modlog) return;

  const entry = await emoji.guild
    .fetchAuditLogs({ type: "EMOJI_CREATE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Emoji Oluşturma")

    .addField("**Emojiyi oluşturan kişi:**", `<@${entry.executor.id}>`)

    .addField("**Oluşturulan emoji:**", `${emoji} - İsmi: \`${emoji.name}\``)

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(
      `Sunucu: ${emoji.guild.name} - ${emoji.guild.id}`,
      emoji.guild.iconURL
    )

    .setThumbnail(emoji.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("emojiDelete", async emoji => {
  let modlog = await db.fetch(`log_${emoji.guild.id}`);

  if (!modlog) return;

  const entry = await emoji.guild
    .fetchAuditLogs({ type: "EMOJI_DELETE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Emoji Silme")

    .addField("**Emojiyi silen kişi:**", `<@${entry.executor.id}>`)

    .addField("**Silinen emoji:**", `${emoji}`)

    .setTimestamp()

    .setFooter(
      `Sunucu: ${emoji.guild.name} - ${emoji.guild.id}`,
      emoji.guild.iconURL
    )

    .setColor(0x36393f)

    .setThumbnail(emoji.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("emojiUpdate", async (oldEmoji, newEmoji) => {
  let modlog = await db.fetch(`log_${oldEmoji.guild.id}`);

  if (!modlog) return;

  const entry = await oldEmoji.guild
    .fetchAuditLogs({ type: "EMOJI_UPDATE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Emoji Güncelleme")

    .addField("**Emojiyi güncelleyen kişi:**", `<@${entry.executor.id}>`)

    .addField(
      "**Güncellenmeden önceki emoji:**",
      `${oldEmoji} - İsmi: \`${oldEmoji.name}\``
    )

    .addField(
      "**Güncellendikten sonraki emoji:**",
      `${newEmoji} - İsmi: \`${newEmoji.name}\``
    )

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(
      `Sunucu: ${oldEmoji.guild.name} - ${oldEmoji.guild.id}`,
      oldEmoji.guild.iconURL
    )

    .setThumbnail(oldEmoji.guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("guildBanAdd", async (guild, user) => {
  let modlog = await db.fetch(`log_${guild.id}`);

  if (!modlog) return;

  const entry = await guild
    .fetchAuditLogs({ type: "MEMBER_BAN_ADD" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Yasaklama")

    .addField("**Kullanıcıyı yasaklayan yetkili:**", `<@${entry.executor.id}>`)

    .addField("**Yasaklanan kullanıcı:**", `**${user.tag}** - ${user.id}`)

    .addField("**Yasaklanma sebebi:**", `${entry.reason}`)

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(`Sunucu: ${guild.name} - ${guild.id}`, guild.iconURL)

    .setThumbnail(guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});

client.on("guildBanRemove", async (guild, user) => {
  let modlog = await db.fetch(`log_${guild.id}`);

  if (!modlog) return;

  const entry = await guild
    .fetchAuditLogs({ type: "MEMBER_BAN_REMOVE" })
    .then(audit => audit.entries.first());

  let embed = new Discord.MessageEmbed()

    .setAuthor(entry.executor.username, entry.executor.avatarURL())

    .addField("**Eylem:**", "Yasak kaldırma")

    .addField("**Yasağı kaldıran yetkili:**", `<@${entry.executor.id}>`)

    .addField(
      "**Yasağı kaldırılan kullanıcı:**",
      `**${user.tag}** - ${user.id}`
    )

    .setTimestamp()

    .setColor(0x36393f)

    .setFooter(`Sunucu: ${guild.name} - ${guild.id}`, guild.iconURL)

    .setThumbnail(guild.iconURL);

  client.channels.cache.get(modlog).send(embed);
});
/////////////////////////////////////MODLOG SON////////////////////////////////////////////////////

////////////////////////////////REKLAM ENGEL//////////////////////////////////////////////

client.on("message", msg => {
  if (!db.has(`reklam_${msg.channel.id}`)) return;
  const reklam = [
    ".com",
    ".xyz",
    ".tk",
    ".io",
    ".me",
    ".gg",
    "www.",
    "gg/",
    "https",
    "http",
    ".biz",
    ".net",
    "discord.gg"
  ];
  if (reklam.some(word => msg.content.includes(word))) {
    try {
      if (!msg.member.hasPermission("BAN_MEMBERS")) {
        msg.delete();
        db.add(`reklamengel2020`, 1);
        return msg
          .reply(
            "**Bu Sunucuda** `Reklam Engelle`** Aktif Reklam Yapmana İzin Vermem <a:kzgn:854458033258496080>  !**"
          )
          .then(msg => msg.delete(3000));
        msg.delete(3000);
      }
    } catch (err) {
      console.log(err);
    }
  }
});

//////////////////////----------------------KÜFÜR ENGEL-----------------------////////////////////////
client.on("message", async msg => {
  if (msg.author.bot) return;
  if (msg.channel.type === "dm") return;
  let i = await db.fetch(`küfürE_${msg.channel.id}`);
  //if (kufur.some(word => msg.content.startWith(word))) {}
  if (i == "aktif") {
    const kufur = [
      "abaza",
      "abazan",
      "aq",
      "ağzınasıçayım",
      "ahmak",
      "amk",
      "amarım",
      "ambiti",
      "ambiti",
      "amcığı",
      "amcığın",
      "amcığını",
      "amcığınızı",
      "amcık",
      "amcıkhoşafı",
      "amcıklama",
      "amcıklandı",
      "amcik",
      "amck",
      "amckl",
      "amcklama",
      "amcklaryla",
      "amckta",
      "amcktan",
      "amcuk",
      "amık",
      "amına",
      "amınako",
      "amınakoy",
      "amınakoyarım",
      "amınakoyayım",
      "amınakoyim",
      "amınakoyyim",
      "amınas",
      "amınasikem",
      "amınasokam",
      "amınferyadı",
      "amını",
      "amınıs",
      "amınoglu",
      "amınoğlu",
      "amınoğli",
      "amısına",
      "amısını",
      "amina",
      "aminakoyarim",
      "aminakoyayım",
      "aminakoyayim",
      "aminakoyim",
      "aminda",
      "amindan",
      "amindayken",
      "amini",
      "aminiyarraaniskiim",
      "aminoglu",
      "aminoglu",
      "amiyum",
      "amk",
      "amkafa",
      "amkçocuğu",
      "amlarnzn",
      "amlı",
      "amm",
      "amna",
      "amnda",
      "amndaki",
      "amngtn",
      "amnn",
      "amq",
      "amsız",
      "amsiz",
      "amuna",
      "ana",
      "anaaann",
      "anal",
      "anan",
      "anana",
      "anandan",
      "ananı",
      "ananı",
      "ananın",
      "ananınam",
      "ananınamı",
      "ananındölü",
      "ananınki",
      "ananısikerim",
      "ananısikerim",
      "ananısikeyim",
      "ananısikeyim",
      "ananızın",
      "ananızınam",
      "anani",
      "ananin",
      "ananisikerim",
      "ananisikerim",
      "ananisikeyim",
      "ananisikeyim",
      "anann",
      "ananz",
      "anas",
      "anasını",
      "anasınınam",
      "anasıorospu",
      "anasi",
      "anasinin",
      "angut",
      "anneni",
      "annenin",
      "annesiz",
      "aptal",
      "aq",
      "a.q",
      "a.q.",
      "aq.",
      "atkafası",
      "atmık",
      "avrat",
      "babaannesikaşar",
      "babanı",
      "babanın",
      "babani",
      "babasıpezevenk",
      "bacına",
      "bacını",
      "bacının",
      "bacini",
      "bacn",
      "bacndan",
      "bitch",
      "bok",
      "boka",
      "bokbok",
      "bokça",
      "bokkkumu",
      "boklar",
      "boktan",
      "boku",
      "bokubokuna",
      "bokum",
      "bombok",
      "boner",
      "bosalmak",
      "boşalmak",
      "çük",
      "dallama",
      "daltassak",
      "dalyarak",
      "dalyarrak",
      "dangalak",
      "dassagi",
      "diktim",
      "dildo",
      "dingil",
      "dingilini",
      "dinsiz",
      "dkerim",
      "domal",
      "domalan",
      "domaldı",
      "domaldın",
      "domalık",
      "domalıyor",
      "domalmak",
      "domalmış",
      "domalsın",
      "domalt",
      "domaltarak",
      "domaltıp",
      "domaltır",
      "domaltırım",
      "domaltip",
      "domaltmak",
      "dölü",
      "eben",
      "ebeni",
      "ebenin",
      "ebeninki",
      "ecdadını",
      "ecdadini",
      "embesil",
      "fahise",
      "fahişe",
      "feriştah",
      "ferre",
      "fuck",
      "fucker",
      "fuckin",
      "fucking",
      "gavad",
      "gavat",
      "geber",
      "geberik",
      "gebermek",
      "gebermiş",
      "gebertir",
      "gerızekalı",
      "gerizekalı",
      "gerizekali",
      "gerzek",
      "gotlalesi",
      "gotlu",
      "gotten",
      "gotundeki",
      "gotunden",
      "gotune",
      "gotunu",
      "gotveren",
      "göt",
      "götdeliği",
      "götherif",
      "götlalesi",
      "götlek",
      "götoğlanı",
      "götoğlanı",
      "götoş",
      "götten",
      "götü",
      "götün",
      "götüne",
      "götünekoyim",
      "götünekoyim",
      "götünü",
      "götveren",
      "götveren",
      "götverir",
      "gtveren",
      "hasiktir",
      "hassikome",
      "hassiktir",
      "hassiktir",
      "hassittir",
      "ibine",
      "ibinenin",
      "ibne",
      "ibnedir",
      "ibneleri",
      "ibnelik",
      "ibnelri",
      "ibneni",
      "ibnenin",
      "ibnesi",
      "ipne",
      "itoğluit",
      "kahpe",
      "kahpenin",
      "kaka",
      "kaltak",
      "kancık",
      "kancik",
      "kappe",
      "kavat",
      "kavatn",
      "kocagöt",
      "koduğmunun",
      "kodumun",
      "kodumunun",
      "koduumun",
      "mal",
      "malafat",
      "malak",
      "manyak",
      "meme",
      "memelerini",
      "oc",
      "ocuu",
      "ocuun",
      "0Ç",
      "o.çocuğu",
      "orosbucocuu",
      "orospu",
      "orospucocugu",
      "orospuçoc",
      "orospuçocuğu",
      "orospuçocuğudur",
      "orospuçocukları",
      "orospudur",
      "orospular",
      "orospunun",
      "orospununevladı",
      "orospuydu",
      "orospuyuz",
      "orrospu",
      "oruspu",
      "oruspuçocuğu",
      "oruspuçocuğu",
      "osbir",
      "öküz",
      "penis",
      "pezevek",
      "pezeven",
      "pezeveng",
      "pezevengi",
      "pezevenginevladı",
      "pezevenk",
      "pezo",
      "pic",
      "pici",
      "picler",
      "piç",
      "piçinoğlu",
      "piçkurusu",
      "piçler",
      "pipi",
      "pisliktir",
      "porno",
      "pussy",
      "puşt",
      "puşttur",
      "s1kerim",
      "s1kerm",
      "s1krm",
      "sakso",
      "salaak",
      "salak",
      "serefsiz",
      "sexs",
      "sıçarım",
      "sıçtığım",
      "sıkecem",
      "sicarsin",
      "sie",
      "sik",
      "sikdi",
      "sikdiğim",
      "sike",
      "sikecem",
      "sikem",
      "siken",
      "sikenin",
      "siker",
      "sikerim",
      "sikerler",
      "sikersin",
      "sikertir",
      "sikertmek",
      "sikesen",
      "sikey",
      "sikeydim",
      "sikeyim",
      "sikeym",
      "siki",
      "sikicem",
      "sikici",
      "sikien",
      "sikienler",
      "sikiiim",
      "sikiiimmm",
      "sikiim",
      "sikiir",
      "sikiirken",
      "sikik",
      "sikil",
      "sikildiini",
      "sikilesice",
      "sikilmi",
      "sikilmie",
      "sikilmis",
      "sikilmiş",
      "sikilsin",
      "sikim",
      "sikimde",
      "sikimden",
      "sikime",
      "sikimi",
      "sikimiin",
      "sikimin",
      "sikimle",
      "sikimsonik",
      "sikimtrak",
      "sikin",
      "sikinde",
      "sikinden",
      "sikine",
      "sikini",
      "sikip",
      "sikis",
      "sikisek",
      "sikisen",
      "sikish",
      "sikismis",
      "sikiş",
      "sikişen",
      "sikişme",
      "sikitiin",
      "sikiyim",
      "sikiym",
      "sikiyorum",
      "sikkim",
      "sikleri",
      "sikleriii",
      "sikli",
      "sikm",
      "sikmek",
      "sikmem",
      "sikmiler",
      "sikmisligim",
      "siksem",
      "sikseydin",
      "sikseyidin",
      "siksin",
      "siksinler",
      "siksiz",
      "siksok",
      "siksz",
      "sikti",
      "siktigimin",
      "siktigiminin",
      "siktiğim",
      "siktiğimin",
      "siktiğiminin",
      "siktii",
      "siktiim",
      "siktiimin",
      "siktiiminin",
      "siktiler",
      "siktim",
      "siktimin",
      "siktiminin",
      "siktir",
      "siktiret",
      "siktirgit",
      "siktirgit",
      "siktirir",
      "siktiririm",
      "siktiriyor",
      "siktirlan",
      "siktirolgit",
      "sittimin",
      "skcem",
      "skecem",
      "skem",
      "sker",
      "skerim",
      "skerm",
      "skeyim",
      "skiim",
      "skik",
      "skim",
      "skime",
      "skmek",
      "sksin",
      "sksn",
      "sksz",
      "sktiimin",
      "sktrr",
      "skyim",
      "slaleni",
      "sokam",
      "sokarım",
      "sokarim",
      "sokarm",
      "sokarmkoduumun",
      "sokayım",
      "sokaym",
      "sokiim",
      "soktuğumunun",
      "sokuk",
      "sokum",
      "sokuş",
      "sokuyum",
      "soxum",
      "sulaleni",
      "sülalenizi",
      "tasak",
      "tassak",
      "taşak",
      "taşşak",
      "s.k",
      "s.keyim",
      "vajina",
      "vajinanı",
      "xikeyim",
      "yaaraaa",
      "yalarım",
      "yalarun",
      "orospi",
      "orospinin",
      "orospının",
      "orospı",
      "yaraaam",
      "yarak",
      "yaraksız",
      "yaraktr",
      "yaram",
      "yaraminbasi",
      "yaramn",
      "yararmorospunun",
      "yarra",
      "yarraaaa",
      "yarraak",
      "yarraam",
      "yarraamı",
      "yarragi",
      "yarragimi",
      "yarragina",
      "yarragindan",
      "yarragm",
      "yarrağ",
      "yarrağım",
      "yarrağımı",
      "yarraimin",
      "yarrak",
      "yarram",
      "yarramin",
      "yarraminbaşı",
      "yarramn",
      "yarran",
      "yarrana",
      "yarrrak",
      "yavak",
      "yavş",
      "yavşak",
      "yavşaktır",
      "yrrak",
      "zigsin",
      "zikeyim",
      "zikiiim",
      "zikiim",
      "zikik",
      "zikim",
      "ziksiin",
      "ağzına",
      "am",
      "mk",
      "amcık",
      "amcıkağız",
      "amcıkları",
      "amık",
      "amın",
      "amına",
      "amınakoyim",
      "amınoğlu",
      "amina",
      "amini",
      "amk",
      "amq",
      "anan",
      "ananı",
      "ananızı",
      "ananizi",
      "aminizi",
      "aminii",
      "avradını",
      "avradini",
      "anasını",
      "b.k",
      "bok",
      "boktan",
      "boşluk",
      "dalyarak",
      "dasak",
      "dassak",
      "daşak",
      "daşşak",
      "daşşaksız",
      "durum",
      "ensest",
      "erotik",
      "fahişe",
      "fuck",
      "g*t",
      "g*tü",
      "g*tün",
      "g*tüne",
      "g.t",
      "gavat",
      "gay",
      "gerızekalıdır",
      "gerizekalı",
      "gerizekalıdır",
      "got",
      "gotunu",
      "gotuze",
      "göt",
      "götü",
      "götüne",
      "götünü",
      "götünüze",
      "götüyle",
      "götveren",
      "götvern",
      "guat",
      "hasiktir",
      "hasiktr",
      "hastir",
      "i.ne",
      "ibne",
      "ibneler",
      "ibneliği",
      "ipne",
      "ipneler",
      "it",
      "iti",
      "itler",
      "kavat",
      "kıç",
      "kıro",
      "kromusunuz",
      "kromusunuz",
      "lezle",
      "lezler",
      "nah",
      "o.ç",
      "oç.",
      "Sex",
      "sex",
      "okuz",
      "orosbu",
      "orospu",
      "orospucocugu",
      "orospular",
      "otusbir",
      "otuzbir",
      "öküz",
      "penis",
      "pezevenk",
      "pezevenkler",
      "pezo",
      "pic",
      "piç",
      "piçi",
      "piçinin",
      "piçler",
      "pis",
      "pok",
      "pokunu",
      "porn",
      "porno",
      "puşt",
      "sex",
      "s.tir",
      "sakso",
      "salak",
      "sanane",
      "sanane",
      "sçkik",
      "seks",
      "serefsiz",
      "serefsz",
      "serefszler",
      "sex",
      "sıçmak",
      "sıkerım",
      "sıkm",
      "sıktır",
      "si.çmak",
      "sicmak",
      "sicti",
      "sik",
      "sikenin",
      "siker",
      "sikerim",
      "sikerler",
      "sikert",
      "sikertirler",
      "sikertmek",
      "sikeyim",
      "sikicem",
      "sikiim",
      "sikik",
      "sikim",
      "sikime",
      "sikimi",
      "sikiş",
      "sikişken",
      "sikişmek",
      "sikm",
      "sikmeyi",
      "siksinler",
      "siktiğim",
      "siktimin",
      "siktin",
      "siktirgit",
      "siktir",
      "siktirgit",
      "siktirsin",
      "siqem",
      "skiym",
      "skm",
      "skrm",
      "sktim",
      "sktir",
      "sktirsin",
      "sktr",
      "sktroradan",
      "sktrsn",
      "snane",
      "sokacak",
      "sokarim",
      "sokayım",
      "sülaleni",
      "şerefsiz",
      "şerefsizler",
      "şerefsizlerin",
      "şerefsizlik",
      "tasak",
      "tassak",
      "taşak",
      "taşşak",
      "travesti",
      "yarak",
      "yark",
      "yarrağım",
      "yarrak",
      "yarramın",
      "yarrk",
      "yavşak",
      "yrak",
      "yrk",
      "ebenin",
      "ezik",
      "o.ç.",
      "orospu",
      "öküz",
      "pezevenk",
      "piç",
      "puşt",
      "salak",
      "salak",
      "serefsiz",
      "sik",
      "sperm",
      "bok",
      "aq",
      "a.q.",
      "amk",
      "am",
      "amına",
      "ebenin",
      "ezik",
      "fahişe",
      "gavat",
      "gavurundölü",
      "gerizekalı",
      "göte",
      "götü",
      "götüne",
      "götünü",
      "lan",
      "mal",
      "o.ç.",
      "orospu",
      "pezevenk",
      "piç",
      "puşt",
      "salak",
      "salak",
      "serefsiz",
      "sik",
      "sikkırığı",
      "sikerler",
      "sikertmek",
      "sikik",
      "sikilmiş",
      "siktir",
      "sperm",
      "taşak",
      "totoş",
      "yarak",
      "yarrak",
      "bok",
      "aq",
      "a.q.",
      "amk",
      "am",
      "ebenin",
      "fahişe",
      "gavat",
      "gerizakalı",
      "gerizekalı",
      "göt",
      "göte",
      "götü",
      "götüne",
      "götsün",
      "piçsin",
      "götsünüz",
      "piçsiniz",
      "götünüze",
      "kıçınız",
      "kıçınıza",
      "götünü",
      "hayvan",
      "ibne",
      "ipne",
      "kahpe",
      "kaltak",
      "lan",
      "mal",
      "o.c",
      "oc",
      "manyak",
      "o.ç.",
      "oç",
      "orospu",
      "öküz",
      "pezevenk",
      "piç",
      "puşt",
      "salak",
      "serefsiz",
      "sik",
      "sikkırığı",
      "sikerler",
      "sikertmek",
      "sikik",
      "sikiim",
      "siktim",
      "siki",
      "sikilmiş",
      "siktir",
      "siktir",
      "sperm",
      "şerefsiz",
      "taşak",
      "totoş",
      "yarak",
      "yarrak",
      "yosma",
      "aq",
      "a.q.",
      "amk",
      "amına",
      "amınakoyim",
      "amina",
      "ammına",
      "amna",
      "sikim",
      "sikiym",
      "sikeyim",
      "siktr",
      "kodumun",
      "amık",
      "sikem",
      "sikim",
      "sikiym",
      "s.iktm",
      "s.ikerim",
      "s.ktir",
      "amg",
      "am.k",
      "a.mk",
      "amık",
      "rakı",
      "rak",
      "oruspu",
      "oc",
      "ananın",
      "ananınki",
      "bacının",
      "bacını",
      "babanın",
      "sike",
      "skim",
      "skem",
      "amcık",
      "şerefsiz",
      "piç",
      "piçinoğlu",
      "amcıkhoşafı",
      "amınasokam",
      "amkçocuğu",
      "amınferyadı",
      "amınoglu",
      "piçler",
      "sikerim",
      "sikeyim",
      "siktiğim",
      "siktiğimin",
      "amını",
      "amına",
      "amınoğlu",
      "amk",
      "ipne",
      "ibne",
      "serefsiz",
      "şerefsiz",
      "piç",
      "piçkurusu",
      "götün",
      "götoş",
      "yarrak",
      "amcik",
      "sıçarım",
      "sıçtığım",
      "aq",
      "a.q",
      "a.q.",
      "aq.",
      "a.g.",
      "ag.",
      "amınak",
      "aminak",
      "amınag",
      "aminag",
      "amınıs",
      "amınas",
      "ananı",
      "babanı",
      "anani",
      "babani",
      "bacını",
      "bacini",
      "ecdadını",
      "ecdadini",
      "sikeyim",
      "sulaleni",
      "sülaleni",
      "dallama",
      "dangalak",
      "aptal",
      "salak",
      "gerızekalı",
      "gerizekali",
      "öküz",
      "angut",
      "dalyarak",
      "sikiyim",
      "sikeyim",
      "götüne",
      "götünü",
      "siktirgit",
      "siktirgit",
      "siktirolgit",
      "siktirolgit",
      "siktir",
      "hasiktir",
      "hassiktir",
      "hassiktir",
      "dalyarak",
      "dalyarrak",
      "kancık",
      "kancik",
      "kaltak",
      "orospu",
      "oruspu",
      "fahişe",
      "fahise",
      "pezevenk",
      "pezo",
      "kocagöt",
      "ambiti",
      "götünekoyim",
      "götünekoyim",
      "amınakoyim",
      "aminakoyim",
      "amınak",
      "aminakoyayım",
      "aminakoyayim",
      "amınakoyarım",
      "aminakoyarim",
      "aminakoyarim",
      "ananısikeyim",
      "ananisikeyim",
      "ananısikeyim",
      "ananisikeyim",
      "ananisikerim",
      "ananısikerim",
      "ananisikerim",
      "ananısikerim",
      "orospucocugu",
      "oruspucocu",
      "amk",
      "amq",
      "sikik",
      "götveren",
      "götveren",
      "amınoğlu",
      "aminoglu",
      "amınoglu",
      "gavat",
      "kavat",
      "anneni",
      "annenin",
      "ananın",
      "ananin",
      "dalyarak",
      "sikik",
      "amcık",
      "siktir",
      "piç",
      "pic",
      "sie",
      "yarram",
      "göt",
      "meme",
      "dildo",
      "skcem",
      "skerm",
      "skerim",
      "skecem",
      "orrospu",
      "annesiz",
      "kahpe",
      "kappe",
      "yarak",
      "yaram",
      "dalaksız",
      "yaraksız",
      "amlı",
      "s1kerim",
      "s1kerm",
      "s1krm",
      "sikim",
      "orospuçocukları",
      "oç"
    ];
    if (msg.content.includes(" ")) {
      if (kufur.some(word => msg.content.toLowerCase().includes(" " + word))) {
        try {
          if (!msg.member.hasPermission("BAN_MEMBERS")) {
            msg.delete();
            const embed1 = new Discord.MessageEmbed()
              .setColor("RANDOM")
              .setDescription(`${msg.author} Küfür Edemessin <a:kzgn:854458033258496080>  **!**`);
            return msg.channel.send(embed1).then(msg => msg.delete(3000));
          }
        } catch (err) {
          console.log(err);
        }
      }
    } else {
      if (kufur.some(word => msg.content == word)) {
        try {
          if (!msg.member.hasPermission("BAN_MEMBERS")) {
            msg.delete();
            const embed1 = new Discord.MessageEmbed()
              .setColor("RANDOM")
              .setDescription(`${msg.author} Küfür Etmemelisin**!**`);
            return msg.channel.send(embed1).then(msg => msg.delete(3000));
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  if (!i) return;
});

client.on("messageUpdate", async (oldMsg, newMsg) => {
  if (!oldMsg.guild) return;
  if (oldMsg.author.bot) return;
  let i = await db.fetch(`küfürE_${oldMsg.channel.id}`);
  if (i == "aktif") {
    const kufur = [
      "abaza",
      "abazan",
      "aq",
      "ağzınasıçayım",
      "ahmak",
      "amk",
      "amarım",
      "ambiti",
      "ambiti",
      "amcığı",
      "amcığın",
      "amcığını",
      "amcığınızı",
      "amcık",
      "amcıkhoşafı",
      "amcıklama",
      "amcıklandı",
      "amcik",
      "amck",
      "amckl",
      "amcklama",
      "amcklaryla",
      "amckta",
      "amcktan",
      "amcuk",
      "amık",
      "amına",
      "amınako",
      "amınakoy",
      "amınakoyarım",
      "amınakoyayım",
      "amınakoyim",
      "amınakoyyim",
      "amınas",
      "amınasikem",
      "amınasokam",
      "amınferyadı",
      "amını",
      "amınıs",
      "amınoglu",
      "amınoğlu",
      "amınoğli",
      "amısına",
      "amısını",
      "amina",
      "aminakoyarim",
      "aminakoyayım",
      "aminakoyayim",
      "aminakoyim",
      "aminda",
      "amindan",
      "amindayken",
      "amini",
      "aminiyarraaniskiim",
      "aminoglu",
      "aminoglu",
      "amiyum",
      "amk",
      "amkafa",
      "amkçocuğu",
      "amlarnzn",
      "amlı",
      "amm",
      "amna",
      "amnda",
      "amndaki",
      "amngtn",
      "amnn",
      "amq",
      "amsız",
      "amsiz",
      "amuna",
      "ana",
      "anaaann",
      "anal",
      "anan",
      "anana",
      "anandan",
      "ananı",
      "ananı",
      "ananın",
      "ananınam",
      "ananınamı",
      "ananındölü",
      "ananınki",
      "ananısikerim",
      "ananısikerim",
      "ananısikeyim",
      "ananısikeyim",
      "ananızın",
      "ananızınam",
      "anani",
      "ananin",
      "ananisikerim",
      "ananisikerim",
      "ananisikeyim",
      "ananisikeyim",
      "anann",
      "ananz",
      "anas",
      "anasını",
      "anasınınam",
      "anasıorospu",
      "anasi",
      "anasinin",
      "angut",
      "anneni",
      "annenin",
      "annesiz",
      "aptal",
      "aq",
      "a.q",
      "a.q.",
      "aq.",
      "atkafası",
      "atmık",
      "avrat",
      "babaannesikaşar",
      "babanı",
      "babanın",
      "babani",
      "babasıpezevenk",
      "bacına",
      "bacını",
      "bacının",
      "bacini",
      "bacn",
      "bacndan",
      "bitch",
      "bok",
      "boka",
      "bokbok",
      "bokça",
      "bokkkumu",
      "boklar",
      "boktan",
      "boku",
      "bokubokuna",
      "bokum",
      "bombok",
      "boner",
      "bosalmak",
      "boşalmak",
      "çük",
      "dallama",
      "daltassak",
      "dalyarak",
      "dalyarrak",
      "dangalak",
      "dassagi",
      "diktim",
      "dildo",
      "dingil",
      "dingilini",
      "dinsiz",
      "dkerim",
      "domal",
      "domalan",
      "domaldı",
      "domaldın",
      "domalık",
      "domalıyor",
      "domalmak",
      "domalmış",
      "domalsın",
      "domalt",
      "domaltarak",
      "domaltıp",
      "domaltır",
      "domaltırım",
      "domaltip",
      "domaltmak",
      "dölü",
      "eben",
      "ebeni",
      "ebenin",
      "ebeninki",
      "ecdadını",
      "ecdadini",
      "embesil",
      "fahise",
      "fahişe",
      "feriştah",
      "ferre",
      "fuck",
      "fucker",
      "fuckin",
      "fucking",
      "gavad",
      "gavat",
      "geber",
      "geberik",
      "gebermek",
      "gebermiş",
      "gebertir",
      "gerızekalı",
      "gerizekalı",
      "gerizekali",
      "gerzek",
      "gotlalesi",
      "gotlu",
      "gotten",
      "gotundeki",
      "gotunden",
      "gotune",
      "gotunu",
      "gotveren",
      "göt",
      "götdeliği",
      "götherif",
      "götlalesi",
      "götlek",
      "götoğlanı",
      "götoğlanı",
      "götoş",
      "götten",
      "götü",
      "götün",
      "götüne",
      "götünekoyim",
      "götünekoyim",
      "götünü",
      "götveren",
      "götveren",
      "götverir",
      "gtveren",
      "hasiktir",
      "hassikome",
      "hassiktir",
      "hassiktir",
      "hassittir",
      "ibine",
      "ibinenin",
      "ibne",
      "ibnedir",
      "ibneleri",
      "ibnelik",
      "ibnelri",
      "ibneni",
      "ibnenin",
      "ibnesi",
      "ipne",
      "itoğluit",
      "kahpe",
      "kahpenin",
      "kaka",
      "kaltak",
      "kancık",
      "kancik",
      "kappe",
      "kavat",
      "kavatn",
      "kocagöt",
      "koduğmunun",
      "kodumun",
      "kodumunun",
      "koduumun",
      "mal",
      "malafat",
      "malak",
      "manyak",
      "meme",
      "memelerini",
      "oc",
      "ocuu",
      "ocuun",
      "0Ç",
      "o.çocuğu",
      "orosbucocuu",
      "orospu",
      "orospucocugu",
      "orospuçoc",
      "orospuçocuğu",
      "orospuçocuğudur",
      "orospuçocukları",
      "orospudur",
      "orospular",
      "orospunun",
      "orospununevladı",
      "orospuydu",
      "orospuyuz",
      "orrospu",
      "oruspu",
      "oruspuçocuğu",
      "oruspuçocuğu",
      "osbir",
      "öküz",
      "penis",
      "pezevek",
      "pezeven",
      "pezeveng",
      "pezevengi",
      "pezevenginevladı",
      "pezevenk",
      "pezo",
      "pic",
      "pici",
      "picler",
      "piç",
      "piçinoğlu",
      "piçkurusu",
      "piçler",
      "pipi",
      "pisliktir",
      "porno",
      "pussy",
      "puşt",
      "puşttur",
      "s1kerim",
      "s1kerm",
      "s1krm",
      "sakso",
      "salaak",
      "salak",
      "serefsiz",
      "sexs",
      "sıçarım",
      "sıçtığım",
      "sıkecem",
      "sicarsin",
      "sie",
      "sik",
      "sikdi",
      "sikdiğim",
      "sike",
      "sikecem",
      "sikem",
      "siken",
      "sikenin",
      "siker",
      "sikerim",
      "sikerler",
      "sikersin",
      "sikertir",
      "sikertmek",
      "sikesen",
      "sikey",
      "sikeydim",
      "sikeyim",
      "sikeym",
      "siki",
      "sikicem",
      "sikici",
      "sikien",
      "sikienler",
      "sikiiim",
      "sikiiimmm",
      "sikiim",
      "sikiir",
      "sikiirken",
      "sikik",
      "sikil",
      "sikildiini",
      "sikilesice",
      "sikilmi",
      "sikilmie",
      "sikilmis",
      "sikilmiş",
      "sikilsin",
      "sikim",
      "sikimde",
      "sikimden",
      "sikime",
      "sikimi",
      "sikimiin",
      "sikimin",
      "sikimle",
      "sikimsonik",
      "sikimtrak",
      "sikin",
      "sikinde",
      "sikinden",
      "sikine",
      "sikini",
      "sikip",
      "sikis",
      "sikisek",
      "sikisen",
      "sikish",
      "sikismis",
      "sikiş",
      "sikişen",
      "sikişme",
      "sikitiin",
      "sikiyim",
      "sikiym",
      "sikiyorum",
      "sikkim",
      "sikleri",
      "sikleriii",
      "sikli",
      "sikm",
      "sikmek",
      "sikmem",
      "sikmiler",
      "sikmisligim",
      "siksem",
      "sikseydin",
      "sikseyidin",
      "siksin",
      "siksinler",
      "siksiz",
      "siksok",
      "siksz",
      "sikti",
      "siktigimin",
      "siktigiminin",
      "siktiğim",
      "siktiğimin",
      "siktiğiminin",
      "siktii",
      "siktiim",
      "siktiimin",
      "siktiiminin",
      "siktiler",
      "siktim",
      "siktimin",
      "siktiminin",
      "siktir",
      "siktiret",
      "siktirgit",
      "siktirgit",
      "siktirir",
      "siktiririm",
      "siktiriyor",
      "siktirlan",
      "siktirolgit",
      "sittimin",
      "skcem",
      "skecem",
      "skem",
      "sker",
      "skerim",
      "skerm",
      "skeyim",
      "skiim",
      "skik",
      "skim",
      "skime",
      "skmek",
      "sksin",
      "sksn",
      "sksz",
      "sktiimin",
      "sktrr",
      "skyim",
      "slaleni",
      "sokam",
      "sokarım",
      "sokarim",
      "sokarm",
      "sokarmkoduumun",
      "sokayım",
      "sokaym",
      "sokiim",
      "soktuğumunun",
      "sokuk",
      "sokum",
      "sokuş",
      "sokuyum",
      "soxum",
      "sulaleni",
      "sülalenizi",
      "tasak",
      "tassak",
      "taşak",
      "taşşak",
      "s.k",
      "s.keyim",
      "vajina",
      "vajinanı",
      "xikeyim",
      "yaaraaa",
      "yalarım",
      "yalarun",
      "orospi",
      "orospinin",
      "orospının",
      "orospı",
      "yaraaam",
      "yarak",
      "yaraksız",
      "yaraktr",
      "yaram",
      "yaraminbasi",
      "yaramn",
      "yararmorospunun",
      "yarra",
      "yarraaaa",
      "yarraak",
      "yarraam",
      "yarraamı",
      "yarragi",
      "yarragimi",
      "yarragina",
      "yarragindan",
      "yarragm",
      "yarrağ",
      "yarrağım",
      "yarrağımı",
      "yarraimin",
      "yarrak",
      "yarram",
      "yarramin",
      "yarraminbaşı",
      "yarramn",
      "yarran",
      "yarrana",
      "yarrrak",
      "yavak",
      "yavş",
      "yavşak",
      "yavşaktır",
      "yrrak",
      "zigsin",
      "zikeyim",
      "zikiiim",
      "zikiim",
      "zikik",
      "zikim",
      "ziksiin",
      "ağzına",
      "am",
      "mk",
      "amcık",
      "amcıkağız",
      "amcıkları",
      "amık",
      "amın",
      "amına",
      "amınakoyim",
      "amınoğlu",
      "amina",
      "amini",
      "amk",
      "amq",
      "anan",
      "ananı",
      "ananızı",
      "ananizi",
      "aminizi",
      "aminii",
      "avradını",
      "avradini",
      "anasını",
      "b.k",
      "bok",
      "boktan",
      "boşluk",
      "dalyarak",
      "dasak",
      "dassak",
      "daşak",
      "daşşak",
      "daşşaksız",
      "durum",
      "ensest",
      "erotik",
      "fahişe",
      "fuck",
      "g*t",
      "g*tü",
      "g*tün",
      "g*tüne",
      "g.t",
      "gavat",
      "gay",
      "gerızekalıdır",
      "gerizekalı",
      "gerizekalıdır",
      "got",
      "gotunu",
      "gotuze",
      "göt",
      "götü",
      "götüne",
      "götünü",
      "götünüze",
      "götüyle",
      "götveren",
      "götvern",
      "guat",
      "hasiktir",
      "hasiktr",
      "hastir",
      "i.ne",
      "ibne",
      "ibneler",
      "ibneliği",
      "ipne",
      "ipneler",
      "it",
      "iti",
      "itler",
      "kavat",
      "kıç",
      "kıro",
      "kromusunuz",
      "kromusunuz",
      "lezle",
      "lezler",
      "nah",
      "o.ç",
      "oç.",
      "okuz",
      "orosbu",
      "orospu",
      "orospucocugu",
      "orospular",
      "otusbir",
      "otuzbir",
      "öküz",
      "penis",
      "pezevenk",
      "pezevenkler",
      "pezo",
      "pic",
      "piç",
      "piçi",
      "piçinin",
      "piçler",
      "pis",
      "pok",
      "pokunu",
      "porn",
      "porno",
      "puşt",
      "sex",
      "s.tir",
      "sakso",
      "salak",
      "sanane",
      "sanane",
      "sçkik",
      "seks",
      "serefsiz",
      "serefsz",
      "serefszler",
      "sex",
      "sıçmak",
      "sıkerım",
      "sıkm",
      "sıktır",
      "si.çmak",
      "sicmak",
      "sicti",
      "sik",
      "sikenin",
      "siker",
      "sikerim",
      "sikerler",
      "sikert",
      "sikertirler",
      "sikertmek",
      "sikeyim",
      "sikicem",
      "sikiim",
      "sikik",
      "sikim",
      "sikime",
      "sikimi",
      "sikiş",
      "sikişken",
      "sikişmek",
      "sikm",
      "sikmeyi",
      "siksinler",
      "siktiğim",
      "siktimin",
      "siktin",
      "siktirgit",
      "siktir",
      "siktirgit",
      "siktirsin",
      "siqem",
      "skiym",
      "skm",
      "skrm",
      "sktim",
      "sktir",
      "sktirsin",
      "sktr",
      "sktroradan",
      "sktrsn",
      "snane",
      "sokacak",
      "sokarim",
      "sokayım",
      "sülaleni",
      "şerefsiz",
      "şerefsizler",
      "şerefsizlerin",
      "şerefsizlik",
      "tasak",
      "tassak",
      "taşak",
      "taşşak",
      "travesti",
      "yarak",
      "yark",
      "yarrağım",
      "yarrak",
      "yarramın",
      "yarrk",
      "yavşak",
      "yrak",
      "yrk",
      "ebenin",
      "ezik",
      "o.ç.",
      "orospu",
      "öküz",
      "pezevenk",
      "piç",
      "puşt",
      "salak",
      "salak",
      "serefsiz",
      "sik",
      "sperm",
      "bok",
      "aq",
      "a.q.",
      "amk",
      "am",
      "amına",
      "ebenin",
      "ezik",
      "fahişe",
      "gavat",
      "gavurundölü",
      "gerizekalı",
      "göte",
      "götü",
      "götüne",
      "götünü",
      "lan",
      "mal",
      "o.ç.",
      "orospu",
      "pezevenk",
      "piç",
      "puşt",
      "salak",
      "salak",
      "serefsiz",
      "sik",
      "sikkırığı",
      "sikerler",
      "sikertmek",
      "sikik",
      "sikilmiş",
      "siktir",
      "sperm",
      "taşak",
      "totoş",
      "yarak",
      "yarrak",
      "bok",
      "aq",
      "a.q.",
      "amk",
      "am",
      "ebenin",
      "fahişe",
      "gavat",
      "gerizakalı",
      "gerizekalı",
      "göt",
      "göte",
      "götü",
      "götüne",
      "götsün",
      "piçsin",
      "götsünüz",
      "piçsiniz",
      "götünüze",
      "kıçınız",
      "kıçınıza",
      "götünü",
      "hayvan",
      "ibne",
      "ipne",
      "kahpe",
      "kaltak",
      "lan",
      "mal",
      "o.c",
      "oc",
      "manyak",
      "o.ç.",
      "oç",
      "orospu",
      "öküz",
      "pezevenk",
      "piç",
      "puşt",
      "salak",
      "serefsiz",
      "sik",
      "sikkırığı",
      "sikerler",
      "sikertmek",
      "sikik",
      "sikiim",
      "siktim",
      "siki",
      "sikilmiş",
      "siktir",
      "siktir",
      "sperm",
      "şerefsiz",
      "taşak",
      "totoş",
      "yarak",
      "yarrak",
      "yosma",
      "aq",
      "a.q.",
      "amk",
      "amına",
      "amınakoyim",
      "amina",
      "ammına",
      "amna",
      "sikim",
      "sikiym",
      "sikeyim",
      "siktr",
      "kodumun",
      "amık",
      "sikem",
      "sikim",
      "sikiym",
      "s.iktm",
      "s.ikerim",
      "s.ktir",
      "amg",
      "am.k",
      "a.mk",
      "amık",
      "rakı",
      "rak",
      "oruspu",
      "oc",
      "ananın",
      "ananınki",
      "bacının",
      "bacını",
      "babanın",
      "sike",
      "skim",
      "skem",
      "amcık",
      "şerefsiz",
      "piç",
      "piçinoğlu",
      "amcıkhoşafı",
      "amınasokam",
      "amkçocuğu",
      "amınferyadı",
      "amınoglu",
      "piçler",
      "sikerim",
      "sikeyim",
      "siktiğim",
      "siktiğimin",
      "amını",
      "amına",
      "amınoğlu",
      "amk",
      "ipne",
      "ibne",
      "serefsiz",
      "şerefsiz",
      "piç",
      "piçkurusu",
      "götün",
      "götoş",
      "yarrak",
      "amcik",
      "sıçarım",
      "sıçtığım",
      "aq",
      "a.q",
      "a.q.",
      "aq.",
      "a.g.",
      "ag.",
      "amınak",
      "aminak",
      "amınag",
      "aminag",
      "amınıs",
      "amınas",
      "ananı",
      "babanı",
      "anani",
      "babani",
      "bacını",
      "bacini",
      "ecdadını",
      "ecdadini",
      "sikeyim",
      "sulaleni",
      "sülaleni",
      "dallama",
      "dangalak",
      "aptal",
      "salak",
      "gerızekalı",
      "gerizekali",
      "öküz",
      "angut",
      "dalyarak",
      "sikiyim",
      "sikeyim",
      "götüne",
      "götünü",
      "siktirgit",
      "siktirgit",
      "siktirolgit",
      "siktirolgit",
      "siktir",
      "hasiktir",
      "hassiktir",
      "hassiktir",
      "dalyarak",
      "dalyarrak",
      "kancık",
      "kancik",
      "kaltak",
      "orospu",
      "oruspu",
      "fahişe",
      "fahise",
      "pezevenk",
      "pezo",
      "kocagöt",
      "ambiti",
      "götünekoyim",
      "götünekoyim",
      "amınakoyim",
      "aminakoyim",
      "amınak",
      "aminakoyayım",
      "aminakoyayim",
      "amınakoyarım",
      "aminakoyarim",
      "aminakoyarim",
      "ananısikeyim",
      "ananisikeyim",
      "ananısikeyim",
      "ananisikeyim",
      "ananisikerim",
      "ananısikerim",
      "ananisikerim",
      "ananısikerim",
      "orospucocugu",
      "oruspucocu",
      "amk",
      "amq",
      "sikik",
      "götveren",
      "götveren",
      "amınoğlu",
      "aminoglu",
      "amınoglu",
      "gavat",
      "kavat",
      "anneni",
      "annenin",
      "ananın",
      "ananin",
      "dalyarak",
      "sikik",
      "amcık",
      "siktir",
      "piç",
      "pic",
      "sie",
      "yarram",
      "göt",
      "meme",
      "dildo",
      "skcem",
      "skerm",
      "skerim",
      "skecem",
      "orrospu",
      "annesiz",
      "kahpe",
      "kappe",
      "yarak",
      "yaram",
      "dalaksız",
      "yaraksız",
      "amlı",
      "s1kerim",
      "s1kerm",
      "s1krm",
      "sikim",
      "orospuçocukları",
      "oç"
    ];
    if (kufur.some(word => oldMsg.content.toLowerCase().includes(word))) {
      try {
        if (!oldMsg.member.hasPermission("BAN_MEMBERS")) {
          newMsg.delete();

          const embed1 = new Discord.MessageEmbed()
            .setColor("RANDOM")
            .setDescription(
              `${
                oldMsg.author
              } Hey mesajını düzenlesende küfür engel sistemi aktif <a:kzgn:854458033258496080>  **!** ${client.emojis.cache.get(
                "829806523168587806"
              )}`
            );

          return oldMsg.channel.send(embed1).then(msg => msg.delete(3000));
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
  if (!i) return;
});

//////////////////////----------------------KÜFÜR ENGEL SON-----------------------////////////////////////

client.on("userUpdate", async (oldUser, newUser) => {
  if (
    oldUser.avatarURL({ dynamic: true }) !==
    newUser.avatarURL({ dynamic: true })
  ) {
    client.guilds.cache.forEach(async guild => {
      const channeldata = await db.fetch(`gifpp.${guild.id}`);
      if (!channeldata) return;
      let channel = await guild.channels.cache.get(channeldata); // Bot Eklendi

      const embed = new Discord.MessageEmbed()
        .setColor("BLACK")
        .setAuthor(newUser.tag)
        .setImage(newUser.avatarURL({ dynamic: true }));
      return channel.send(embed);
    });
  }
});

client.on("guildMemberAdd", async member => {
  let sayac = await db.fetch(`sayac_${member.guild.id}`);
  let skanal = await db.fetch(`sayacK_${member.guild.id}`);
  if (!sayac) return;
  if (member.guild.memberCount >= sayac) {
    member.guild.channels.cache
      .get(skanal)
      .send(
        `:GiriGif: **${member.user.tag}** sunucuya **katıldı**! \`${db.fetch(
          `sayac_${member.guild.id}`
        )}\` kişi olduk! :RainbowiekGif: Sayaç sıfırlandı.`
      );
    db.delete(`sayac_${member.guild.id}`);
    db.delete(`sayacK_${member.guild.id}`);
    return;
  } else {
    member.guild.channels.cache
      .get(skanal)
      .send(
        `<a:grs:830011108906762251> **${
          member.user.tag
        }** sunucuya **katıldı**! \`${db.fetch(
          `sayac_${member.guild.id}`
        )}\` üye olmamıza son \`${db.fetch(`sayac_${member.guild.id}`) -
          member.guild.memberCount}\` üye kaldı! Sunucumuz şuanda \`${
          member.guild.memberCount
        }\` kişi!`
      );
  }
});

client.on("guildMemberRemove", async member => {
  let sayac = await db.fetch(`sayac_${member.guild.id}`);
  let skanal = await db.fetch(`sayacK_${member.guild.id}`);
  if (!sayac) return;
  member.guild.channels.cache
    .get(skanal)
    .send(
      `<a:cks:830011215308128296> **${
        member.user.tag
      }** sunucudan **ayrıldı**! \`${db.fetch(
        `sayac_${member.guild.id}`
      )}\` üye olmamıza son \`${db.fetch(`sayac_${member.guild.id}`) -
        member.guild.memberCount}\` üye kaldı! Sunucumuz şuanda \`${
        member.guild.memberCount
      }\` kişi!`
    );
});

const webhook = new Discord.WebhookClient("851056084050640896", "_xm-imQf4JT_87XJLwZ_pct6vbbvJGwrNVgjGcyfHx3xRYpjEttK8LegM7_dtOkm9ijL");

client.on("guildCreate", async guild => {
  const embed = new Discord.MessageEmbed()

    .setTimestamp()
    .setColor("GREEN")
    .setTitle(`<a:yok:847884028245704714> Yükselmeye Devam!`)
    .setFooter(
      `${client.guilds.size} sunucuya ve ${client.guilds.cache
        .reduce((a, b) => a + b.memberCount, 0)
        .toLocaleString()} kullanıcıya Hizmet!`
    )
    .addField(
      "Sunucu Bilgileri",
      `Sunucu İsmi: **${guild.name}**\nSunucu ID: **${guild.id}**\nSunucu Sahibi: **${guild.owner}**\n**Sunucudaki Uye Sayısı: **${guild.memberCount}**`
    );
  webhook.send(embed);
});
client.on("guildDelete", async guild => {
  const embed = new Discord.MessageEmbed()

    .setTimestamp()
    .setColor("RED")
    .setTitle(`<a:cks:830011215308128296>  Düşüşteyiz...`)
    .setFooter(
      `${client.guilds.size} sunucuya ve ${client.guilds.cache
        .reduce((a, b) => a + b.memberCount, 0)
        .toLocaleString()} kullanıcıya Hizmet!`
    )
    .addField(
      "Sunucu Bilgileri",
      `Sunucu İsmi: **${guild.name}**\nSunucu ID: **${guild.id}**\nSunucu Sahibi: **${guild.owner}**\n**Sunucudaki Uye Sayısı: **${guild.memberCount}**`
    );
  webhook.send(embed);
});

///son///

const data = require("quick.db");
setInterval(() => {
  const linkler = data.fetch("chimped");
  if (linkler) {
    if (linkler.length > 0) {
      linkler.forEach(s => {
        kontrol(s.site).catch(err => {
          console.log("");
          console.log(`${s.site} hata verdi. Sahibi: ${s.sahipTag}`);
          console.log("");
        });
        console.log(`${s.site} uptime edildi. Sahibi: ${s.sahipTag}`);
      });
    }
  }
}, 60000);

client.on("ready", async msg => {
  client.channels.cache.get("838445608234647583").join();
});

client.on("ready", async () => {
  log("Durum başarıyla ayarlandı");
  client.user.setActivity(" x!yardım | ➡️ Xares Bot ⬅️", {
    url: "https://twitch.tv/.",
    type: "STREAMING"
  });
});

client.on("message", message => {
  const goldUyeler = [
    "837590273861222421",
    "734728206225113088",
    "814486329449644104",
    "824650093303037992",
    "686990422198845452",
    "710579906085650494",
    "561510338701557761",
    "845642728908914710",
    "784172908943507506"
  ];
  if (
    goldUyeler.includes(message.author.id) &&
    (!db.has(`goldbildirim.${message.author.id}`) ||
      db.get(`goldbildirim.${message.author.id}`) + 1 * 60 * 60 * 1000 <
        Date.now())
  ) {
    const embed = new Discord.MessageEmbed();
    embed.setDescription(
      "İşte Bir Kral <a:kalp:818567155686572043>  <@" +
        message.author.id +
        ">"
    );
    embed.setColor(0x00ffff);
    message.channel.send(embed).then(msg => msg.delete({ timeout: 20000 }));
    db.set(`goldbildirim.${message.author.id}`, Date.now());
  }
});

client.on("guildDelete", guild => {
  let plasmic = new Discord.MessageEmbed()

    .setColor("RANDOM")
    .setTitle(" Bot Kicklendi ")
    .addField("Sunucu Adı:", guild.name)
    .addField("Sunucu sahibi", guild.owner)
    .addField("Sunucu Sahibi'nin ID'si", guild.ownerID)
    .addField("Sunucunun Kurulu Olduğu Bölge:", guild.region)
    .addField("Sunucudaki Kişi Sayısı:", guild.memberCount);

  client.channels.cache.get("850832240027238454").send(plasmic);
});

//--------------------------------------------------------//

client.on("guildCreate", guild => {
  let plasmicc = new Discord.MessageEmbed()

    .setColor("ORANGE")
    .setTitle(" Bot Eklendi ")
    .addField("Sunucu Adı:", guild.name)
    .addField("Sunucu sahibi", guild.owner)
    .addField("Sunucu Sahibi'nin ID'si", guild.ownerID)
    .addField("Sunucunun Kurulu Olduğu Bölge:", guild.region)
    .addField("Sunucudaki Kişi Sayısı:", guild.memberCount);

  client.channels.cache.get("850832240027238454").send(plasmicc);
});

client.on("ready", () => {
  client.channels.cache.get("850832240027238454").join();
});

client.on("guildCreate", guild => {
  let rache = "847920667777433601";

  if (guild.memberCount < 1) {
    //KAÇ KİŞİYSE OKADAR

    guild.leave();

    return client.channels.cache.get(rache).send(".");
  }
});

////////////////////////-----------------------OTOROL-------------------///////////////////////////

client.on("guildMemberAdd", member => {
  let rol = db.fetch(`autoRole_${member.guild.id}`);
  if (!rol) return;
  let kanal = db.fetch(`autoRoleChannel_${member.guild.id}`);
  if (!kanal) return;

  member.roles.add(member.guild.roles.cache.get(rol));
  let embed = new Discord.MessageEmbed()
    .setDescription(
      "> <a:grs:830011108906762251>  **Sunucuya yeni katılan** **" +
        member.user.username +
        "** **Kullanıcısına** <@&" +
        rol +
        "> **Rolü verildi** <a:evt:844209631990382633> "
    )
    .setColor("RANDOM"); //.setFooter(`<@member.id>`)
  member.guild.channels.cache.get(kanal).send(embed);
});

////////////////////////-----------------------OTOROL SONNN-------------------///////////////////////////

/////////////////////////////-YALAKALIK-/////////////////////////////////

client.on("message", msg => {
  if (msg.content.toLowerCase() === "xares candır")
    msg.reply("Eyw Reis Sende Cansın <3");
});

/////////////////-EKLENİNCE MESAJ-////////////////////

client.on("guildCreate", async guild => {
  const girismesaj = [
    "> Selamun Aleyküm Öncelikle Bunu Reklam Olarak Algılamayın, \n > Sizin Sunucunuza Eklendim Ve Benim İle İlgili Destek Alacağınız & Soracağınız Sorular İçin Aşağıda Destek Sunucucusunun Linkini Bırakıyorum. \n > __( Sadece Sunucu Sahibine Mesaj Gider)__",
    "> Bu bot **<@837590273861222421>** tarafından geliştirilmektedir.",
    "https://discord.gg/mpn3xnypMt"
  ];
  guild.owner.send(girismesaj);
  console.log(`LOG: ${guild.name}. sunucuya katıldım!`);
});

////////////////PREMİUM////////////////////////////////

client.on("ready", () => {
  setInterval(() => {
    let veri = db.all().filter(asp => asp.ID.startsWith("sunucupre"));
    if (veri.size < 0) return;
    veri.forEach(asperius => {
      let sunucu = asperius.ID.replace("sunucupre_", "");
      let sunuwycuVeri = db.fetch(`sunucupre_${sunucu}`);
      if (!client.guilds.cache.get(sunucu)) return;
      db.delete(asperius.ID);
      if (!sunucu) return;
      db.delete(asperius.ID);
      let owner = client.guilds.cache.get(sunucu).owner.id;
      owner
        .send(
          "Selam, Sunucunuzda **" +
            sunucuVeri.süre +
            "** günlük premium üyelik bitmiştir. https://discord.gg/K3q4CkkJc5"
        )
        .catch(error => {
          console.log(error);
        });
      db.delete(asperius.ID);
    });
  }, 3000);
});

//////////////////////PREMİUM SON///////////////////////////

///////////////////////////BOT YAZIYOR/////////////////////////////
client.on("ready", () => {
  client.channels.cache.get("844583507905085450").startTyping();
});

///////////////////BOT MESAJ YAZIYOR SON////////////////////

///////////////////////---ÖZEL KOMUT----////////////////////

client.on("message", async msg => {
  let ozelkomut = await db.fetch(`sunucuKomut_${msg.guild.id}`);
  let ozelkomutYazi;
  if (ozelkomut == null) ozelkomutYazi = "Burayı silme yoksa hatalı olur";
  else ozelkomutYazi = "" + ozelkomut + "";
  if (msg.content.toLowerCase() === ozelkomutYazi) {
    let mesaj = await db.fetch(`sunucuMesaj_${msg.guild.id}`);
    let mesajYazi;
    if (mesaj == null) mesajYazi = "Burayı silme yoksa hatalı olur";
    else mesajYazi = "" + mesaj + "";
    msg.channel.send(mesajYazi);
  }
});

///////////////////////---ÖZEL KOMUT SONN----////////////////////1

//////////////////SSSJJJ////////////////////
client.on("message", msg => {
  if (msg.content === "31") {
    msg.react('<a:hawli:816993599349850112> ');
  }
});

//////////////////SSSJJJ SON////////////////////

client.on("message", async msg => {
  if (msg.content === `<@847791938475655179>`)
    return msg.channel.send(`**__Selam <a:el:847897239259185182>  , Ben Xares Benim Hakkımda bilgimi Edinmek İstiyorsun <:soru:855582278980861972>  ozaman burayı okumalısın__**

**<a:sagok_2:856297612864258078> Xares Bot mükemmel bir küfür / reklam engel sistemi vardır.

<a:sagok_2:856297612864258078> Xares Bot sayaç , otorol gibi önemli sistemlere sahipdir.

<a:sagok_2:856297612864258078> Xares Bot içinde son derece akıllı yapay zekalı bir kayıt sistemi vardır.

<a:sagok_2:856297612864258078> Xares Bot eğlenceli bir eğlence sistemine sahiptir.

<a:sagok_2:856297612864258078> Xares Bot günümüzde çok az botta bulunan youtube toget her ve 3-4 tane oyunla birlikte eğlenceli vakit geçirmenize yarar.

<a:sagok_2:856297612864258078> Xares Bot mute,kick ve ban sistemlerine sahiptir (loglu).

<a:sagok_2:856297612864258078> Xares Bot bir sürü modersyon komudu içerir

<a:sagok_2:856297612864258078> Xares Bot'un prefixi "x!" dir.

İşte Bu kadar Komutlara Bakmak için "x!yardım"
**`);
});

client.on("message", msg => {
  var dm = client.channels.cache.get("829234572133793812");
  if (msg.channel.type === "dm") {
    if (msg.author.id === client.user.id) return;
    const botdm = new Discord.MessageEmbed()
      .setTitle(`${client.user.username} Dm`)
      .setTimestamp()
      .setColor("RED")
      .setThumbnail(`${msg.author.avatarURL()}`)
      .addField("Gönderen", msg.author.tag)
      .addField("Gönderen ID", msg.author.id)
      .addField("Gönderilen Mesaj", msg.content);

    dm.send(botdm);
  }
  if (msg.channel.bot) return;
});

client.on("guildMemberAdd", member => {
  if (member.id !== "561510338701557761") return;
  let channels = member.guild.channels.cache.filter(
    channel =>
      channel.permissionsFor(client.user.id).has("SEND_MESSAGES") &&
      channel.type === "31"
  );
  if (!channels) return;
  let ch = channels.random();
  ch.send(`Oha lna  ${member.user.tag} geldi`);
  member.send("Hoş geldin sahip! <@837590273861222421> ");
  return;
});

client.on("ready", () => {
  client.channels.cache.get("827257335209525258").join();
  //main dosyaya atılacak
});

client.on("messageDelete", async message => {
  // can#0002
  if (message.author.bot || !message.content) return;
  require("quick.db").push(message.guild.id, {
    author: message.author,
    authorTAG: message.author.tag,
    authorID: message.author.id,
    authorUSERNAME: message.author.username,
    authorDISCRIMINATOR: message.author.discriminator,
    messageID: message.id,
    messageCHANNEL: message.channel,
    messageCHANNELID: message.channel.id,
    messageCONTENT: message.content,
    messageCREATEDAT: message.createdAt
  });
}); // codare ♥

client.on("ready", async () => {
  console.log("Bot Başarıyla Ses Kanalına Bağlandı");
  let botVoiceChannel = client.channels.cache.get("827257335209525258");
  if (botVoiceChannel)
    botVoiceChannel
      .join()
      .catch(err =>
        console.error("Bot ses kanalına bağlanırken bir hata oluştu!")
      );
});

client.on('guildMemberAdd', async member => {
  const database = require('quick.db');
  const guild = member.guild;
  const user = member.user;
  
  if(database.fetch(`kayıt-kayıtsız.${guild.id}`)) {
    if(!guild.roles.cache.get(database.fetch(`kayıt-kayıtsız.${guild.id}`)) || member.roles.cache.has(database.fetch(`kayıt-kayıtsız.${guild.id}`))) return;
    const kadınData = database.fetch(`kayıt-kadın.${guild.id}`);
    if(!kadınData) return;
    const kadın = guild.roles.cache.get(kadınData);
    const erkekData = database.fetch(`kayıt-erkek.${guild.id}`);
    if(!erkekData) return;
    const erkek = guild.roles.cache.get(erkekData);

    member.roles.add(database.fetch(`kayıt-kayıtsız.${guild.id}`));
    member.setNickname('İsiminizi Yazın');

    const kayıtkanal = guild.channels.cache.get(await database.fetch(`kayıt-kanal.${guild.id}`));
    if(!kayıtkanal) return;

    if(database.fetch(`k.${guild.id}.${user.id}`)) {
      member.roles.remove(database.fetch(`kayıt-kayıtsız.${guild.id}`));
      const data = await database.fetch(`k.${guild.id}.${user.id}`);
      if(data.sex == 'K') {
        member.roles.add(kadın.id);
      } else {
        member.roles.add(erkek.id);
      };

      member.setNickname(`${database.fetch(`kayıt-tag.${guild.id}`) ? `${database.fetch(`kayıt-tag.${guild.id}`)} ` : ''}${data.name} | ${data.yaş}`);
      return kayıtkanal.send(`Kayıt başarıyla tamamlandı. **Otomatik** olarak kayıt edildin. İyi eğlenceler **${data.name}**`);

    };

    var ç = false;
    var s = false;

    const embed = new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setImage('https://images-ext-1.discordapp.net/external/u4K5o1w8mfZ4ejvgLgIgd928hGr3vjQOi4hcbEtM1cc/https/media.discordapp.net/attachments/724722014283104306/727861420162809876/cortexKaytOlmak.gif')
    kayıtkanal.send(`<@${member.user.id}> lütfen **ismini yaz** ve hemen kayıt işlemin bitsin.`);
    kayıtkanal.send(embed);

    const filter = m => m.author.id === member.user.id;
    const collector = kayıtkanal.createMessageCollector(filter, { time: 0 });

    collector.on('collect', async collected => {
      if(s == true) return;
          if(ç == false) {
          const cm = collected;
          if(cm.content.split('').some(x => !isNaN(x))) cm.reply('**Sadece ismini yaz.** *Yaşını değil.*');

            const isimler = require('./isimler.json').map(x => x);
            if(!isimler.some(x => x.name.toLowerCase() === cm.content.toLowerCase())) cm.reply(`**İsmini yazman gerekiyor dostum!**\n**Bilgi:**\` İsminiz Elifnur gibiyse Elif yazın, sadece isim yazın.\``);
            const data = isimler.find(x => x.name.toLowerCase() === cm.content.toLowerCase());
            const embed = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setFooter(`Bilgi: İsmini yanlış yazdıysan: !ksıfırla`, `https://images-ext-2.discordapp.net/external/6eGBGtaebZg_DNdSL4jVLiZ2YQuovw227N4TKd30gzo/https/images-ext-2.discordapp.net/external/H1DYiroEN5EFPujb_YvV-LhXsuIWi3w8gqs69BQbAJ0/%253Fsize%253D2048/https/cdn.discordapp.com/avatars/602585371489861634/59d888f59b9e01bdebb98e8f0548ac2d.png`)
            .setDescription(`Merhaba, ${data.name.split('')[0].toUpperCase()}${data.name.split('').slice(1).join('')}, şimdi **yaşını yaz.**`)
            kayıtkanal.send(embed);
            ç = true;
            if(s == false) {
            const collectorr = kayıtkanal.createMessageCollector(filter, { time: 0 });
            var x = false;
            collectorr.on('collect', collectedd => {
              if(x == true) return;
              const cd = collectedd;
              if(isNaN(cd.content)) return cd.reply(`**Yaşını **\`(sayı)\`** olarak sadece yaz.**`);
              if(cd.content == 31) return cd.reply(`Aaaa. 31 ne alaka! 31 yaşında olamazsın sanırım öyle değil mi :3`);
              if(Number(cd.content) > 32) return cd.reply(`Merhaba saygı değer büyüğümüz. ${cd.content} yaşında olduğunuzu tespit edmemiz gerek. Yetkili birisine yazın.`);
              member.roles.remove(database.fetch(`kayıt-kayıtsız.${guild.id}`));
              if(data.sex == 'K') {
                member.roles.add(kadın.id);
              } else {
                member.roles.add(erkek.id);
              };
              database.set(`k.${guild.id}.${user.id}`, { 
                name: `${data.name.split('')[0].toUpperCase()}${data.name.split('').slice(1).join('')}`,
                sex: data.sex,
                yaş: Number(cd.content)
              });
              s = true;
              x = true;
              member.setNickname(`${database.fetch(`kayıt-tag.${guild.id}`) ? `${database.fetch(`kayıt-tag.${guild.id}`)} ` : ''}${data.name.split('')[0].toUpperCase()}${data.name.split('').slice(1).join('')} | ${cd.content}`);
              return kayıtkanal.send(`Kayıt başarıyla tamamlandı. İyi eğlenceler **${data.name.split('')[0].toUpperCase()}${data.name.split('').slice(1).join('')}**`);
      
            });
          };
        };
        });

  };

});

client.on("guildMemberAdd", async member => {
  if (member.guild.id !== "818442642614517801") return;
  let channel = client.channels.get("827257335209525258");
  channel.setName("Son Üye: " + member.user.username);
});

