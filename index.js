import {Client, Events, ChannelType, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import {JavaPingClient} from 'craftping'
import 'dotenv/config';
import {readFileSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'

const token = process.env.DISCORD_TOKEN;

const client = new Client({intents: [GatewayIntentBits.Guilds]});

let statusChannelId = JSON.parse(readFileSync('data.json'))["statusChannelId"];

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    setInterval(async () => {
        try {
            await updatePlayerCount()
        } catch (error) {
            console.log('Error updating: ', error)
        }
    }, 300000)
})

//Log in to Discord with Bot's token
client.login(token);

client.on(Events.GuildCreate, async (guild) => {
    console.log('GuildCreate')
    let numPlayers = await getPlayers();
    await createStatusChannel(guild, numPlayers);
})

async function createStatusChannel(guild, numPlayers) {
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
    console.log('Updating Player Count: ', numPlayers)
    const guild = client.guilds.cache.at(0);
    let channel = await guild.channels.fetch(statusChannelId)

    if (!channel) {
        createStatusChannel(guild, numPlayers);
    } else {
        let updatedChannel = await guild.channels.edit(statusChannelId, {name: `Online Players: ${numPlayers}`})
        if (!updatedChannel) {}
        else {
            console.log(updatedChannel)
            console.log(`Updated online players: ${updatedChannel.name}`)
        }

    }
    
}

async function getPlayers() {
    let pingClient = new JavaPingClient();
    try {
        // Use 127.0.0.1 if running this bot on the same machine as the MC server
        let response = await pingClient.ping('96.230.114.156', 25565, {signal: AbortSignal.timeout(5000)});
        console.log('Ping: ', response)
        return response.players.online;
    } catch (error){
        console.log('Could not query server', error)
        return 0
    }
}