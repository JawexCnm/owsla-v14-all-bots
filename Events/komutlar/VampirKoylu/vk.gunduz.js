let {
    EmbedBuilder
} = require("discord.js");
let vampirKoylu = require("../../models/vampirKoylu");
let sunucuayar = require("../../models/sunucuayar");
const moment = require("moment");
const {
    update
} = require("../../models/vampirKoylu");
exports.run = async function (client, message, args, durum, kanal) {
    if (!message.guild) return
    
    let data = await sunucuayar.findOne({});
    const vkyonetici = data.VKAuthor;
    let prefix = client.ayarlar.prefix[0];
    if (!message.member.roles.cache.has(vkyonetici) && !message.member.permissions.has(8)) return message.reply({ content: "Yönetici ya da VK Sorumlusu olman gerekiyor!" })
    if (!message.member.me.voice.channel) return message.reply({ content: `Hata: Bu komutu kullanabilmek için bir ses kanalında olmanız gerekiyor` })
    await vampirKoylu.findOne({
        Guild: message.guild.id
    }, async (err, veri) => {
        if (!veri) return;
        let data = veri.Lobby;
        let data2 = veri.Oyun;
        let authorID = data.filter(veri => veri.Channel === message.member.me.voice.channel.id && veri.Type === true && veri.Author).map(user => user.Author)

        if (data2.filter(x => data.map(x => x.Channel).some(kanal => kanal === message.member.me.voice.channel.id) && x.Durum === true).map(x => x.Channel).some(kontrol => kontrol === message.member.me.voice.channel.id)) {
            if (!authorID.some(user => user == message.author.id)) return message.reply({ content: "Oyunu sadece oyun başlatıcı bitirebilir!" });
            let lobi = data.filter(veri => veri.Channel === message.member.me.voice.channel.id && veri.Type === true);
            let oyun = data2.filter(veri => veri.Channel === message.member.me.voice.channel.id && veri.Durum === true)

            let kazananlar = data2.filter(x => data.map(x => x.Channel).some(kanal => kanal === message.member.me.voice.channel.id) && x.Durum === true).map(x => x.Yasayanlar)[0]
            let oluler = data2.filter(x => data.map(x => x.Channel).some(kanal => kanal === message.member.me.voice.channel.id) && x.Durum === true).map(x => x.Oluler)[0]



            Object.keys(kazananlar).forEach(async (id, index) => {
                setTimeout(async () => {
                    await Object.keys(oluler).map(x => message.guild.members.cache.get(x).voice.setMute(true).catch(() => {}))
                    await message.guild.members.cache.get(id).voice.setMute(false).catch(() => {})
                }, index * 1000)
            })

            const embed = new EmbedBuilder()
                .setAuthor(message.author.username, message.author.avatarURL({dynamic: true}))
                .setDescription('Başarıyla oyun modu gündüz olarak ayarlandı!')
                .setColor('RANDOM')
            message.channel.send({
                embed: embed
            })
        

            var projects = data2;
            const objIndex = projects.findIndex(obj => lobi.some(obj2 => obj.ID === obj2.ID));
            const updatedObj = {
                ...projects[objIndex],
                Zaman: "Gündüz"
            };
            const updatedProjects = [...projects.slice(0, objIndex), updatedObj, ...projects.slice(objIndex + 1)];

            veri.Oyun = updatedProjects
            veri.save();
            return
        }
        if (!data.map(x => x.Channel).some(kanal => kanal === message.member.me.voice.channel.id)) return message.channel.send({ content: new EmbedBuilder().setColor("RED").setDescription(`Oyunu başlatmak için bir lobi oluşturmalısınız! (\`${prefix}vkstart\`)`) })

        return message.reply({ content: "Lütfen bir lobi oluşturunuz" })



    })




}
exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: 0,
}

exports.help = {
    name: 'vkgunduz',
    description: 'Vampir Köylü oyununa sonradan dahil olmak isteyen kullanıcıları eklemektedir',
    usage: 'vkekle @etiket',
    kategori: 'Vampir Koylu'
}

function addValueInObject(object, key, value) {
    var res = {};
    var textObject = JSON.stringify(object);
    if (textObject === '{}') {
        res = JSON.parse('{"' + key + '":"' + value + '"}');
    } else {
        res = JSON.parse('{' + textObject.substring(1, textObject.length - 1) + ',"' + key + '":"' + value + '"}');
    }
    return res;
}