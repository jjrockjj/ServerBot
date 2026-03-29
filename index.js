import {Client, Events, Guild, ChannelType, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import {QueryClient} from 'craftping'
import 'dotenv/config';
import {readFileSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'

const token = process.env.DISCORD_TOKEN;

const client = new Client({intents: [GatewayIntentBits.Guilds]});

let statusChannelId = JSON.parse(readFileSync('data.json'))["statusChannelId"];

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    setInterval(updatePlayerCount, 120000)
})

//Log in to Discord with Bot's token
client.login(token);

client.on(Events.GuildCreate, async (guild) => {
    console.log('GuildCreate')
    let numPlayers = await getPlayers();
    createStatusChannel(guild, numPlayers);
})

// client.on(Events.PresenceUpdate, async () => {
//     console.log('Presence Update')
//     let numPlayers = await getPlayers();
//     const guild = client.guilds.cache.get("GUILD_ID")
//     guild.channels.fetch(statusChannelId)
//     .then(channel => {
//         if (!channel) {
//             createStatusChannel(guild, numPlayers);
//         } else {
//             guild.channels.edit(statusChannelId, {name: `Online Players: ${numPlayers}`})
//             .then(console.log("Updated online players"))
//         }
//     })
// })

function createStatusChannel(guild, numPlayers) {
    console.log('Create Channel')
    if (!statusChannelId) {
        guild.channels.create({
            name: `Online Players: ${numPlayers}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.CreateInstantInvite,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.SendTTSMessages,
                        PermissionFlagsBits.ManageMessages,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.MentionEveryone,
                        PermissionFlagsBits.ManageRoles,
                        PermissionFlagsBits.ManageWebhooks,
                        PermissionFlagsBits.UseApplicationCommands,
                        PermissionFlagsBits.ManageThreads,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.CreatePrivateThreads,
                        PermissionFlagsBits.SendMessagesInThreads,
                        PermissionFlagsBits.UseEmbeddedActivities,
                        PermissionFlagsBits.SendVoiceMessages,
                        PermissionFlagsBits.SendPolls,
                        PermissionFlagsBits.UseExternalApps,
                        PermissionFlagsBits.PinMessages,
                        PermissionFlagsBits.BypassSlowmode,
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.BypassSlowmode,
                        PermissionFlagsBits.ManageMessages,
                    ]
                }
            ]
        }).then((channel) => {
            statusChannelId = channel.id
            writeFile('data.json', `{"statusChannelId": "${statusChannelId}"}`)
            console.log("Created status channel")
        })
    }
}

async function updatePlayerCount() {
    let numPlayers = await getPlayers();
    const guild = client.guilds.cache.at(0);
    guild.channels.fetch(statusChannelId)
    .then(channel => {
        if (!channel) {
            createStatusChannel(guild, numPlayers);
        } else {
            guild.channels.edit(statusChannelId, {name: `Online Players: ${numPlayers}`})
            .then((updatedChannel) => {
                console.log(`Updated online players: ${updatedChannel.name}`)
            })  
        }
    })
}

async function getPlayers() {
    let craftClient = new QueryClient();

    try {
        let basic = await craftClient.queryBasic('96.230.114.156', 25566, AbortSignal.timeout(5000));
        
        await craftClient.close();
        
        console.log('Players: ', basic)
        
        return basic.numplayers;
    } catch (error){
        console.log('Could not query server', error)
    }
}