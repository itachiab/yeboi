
const Discord = require('discord.js');
const client = new Discord.Client()
const express = require('express');
const ayarlar = require('./ayarlar.json');
const captain = new Discord.ShardingManager('./bot.js', {
    totalShards: 2,
    token: (ayarlar.token)
});
// CaptainInvite Shard Bilgi
captain.spawn();

captain.on('shardCreate', shard => {
  console.log(`${shard.id +1} IDli Başlatıldı ve Kullanıma Hazır.`)
    const webhook = new Discord.WebhookClient("","")
    webhook.send(` [Başlatılıyor]   \n${shard.id +1} IDli Başlatılıyor Lütfen Bekleyin.`)
    setTimeout(() => {
  const webhook = new Discord.WebhookClient("","")
  webhook.send(` [Başlatıldı]\n${shard.id +1} IDli Başlatıldı ve Kullanıma Hazır.`)
  }, 3000)
});
// WebHook Oluşturup ID ve Token Girmeniz Gerekli.
setTimeout(() => {
    captain.broadcastEval("process.exit()");
}, 8600000);
// 8600000 Yaklışık 2.30 Saat Sonra İşlem Çıkışı Yapacak!!
