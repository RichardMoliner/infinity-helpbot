require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // <- INTENT ADICIONADA
    ],
    partials: [Partials.Channel, Partials.ThreadMember],
});

client.commands = new Collection();

// Carregar os comandos dinamicamente da pasta 'commands'
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if (
            command &&
            typeof command.data === 'object' &&
            typeof command.execute === 'function' &&
            typeof command.data.name === 'string' &&
            command.data.name.length > 0
        ) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[AVISO] O comando ${file} está mal formatado e foi ignorado.`);
        }
    } catch (error) {
        console.error(`[ERRO] Falha ao carregar o comando ${file}:`, error);
    }
}

client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    const commandsToRegister = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());

    if (GUILD_ID && GUILD_ID.length > 5) {
        console.log(`🔍 Tentando buscar a guild ${GUILD_ID} via API...`);

        try {
            const guild = await client.guilds.fetch(GUILD_ID);
            console.log(`🚀 Guilda "${guild.name}" encontrada!`);
            await guild.commands.set(commandsToRegister);
            console.log(`✅ Comandos sincronizados na guild "${guild.name}"`);
        } catch (err) {
            console.warn(`❌ Erro ao buscar ou sincronizar na guild ${GUILD_ID}: ${err.message}`);
            console.warn('ℹ️ O bot pode ainda não estar adicionado corretamente ao servidor. Sincronização ignorada por enquanto.');
        }

    } else {
        console.warn('⚠️ GUILD_ID não fornecida. Pulei a sincronização local de comandos.');
    }
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ Comando "${interaction.commandName}" não encontrado.`);
        const response = { content: 'Comando não encontrado.', ephemeral: true };
        interaction.replied || interaction.deferred
            ? await interaction.followUp(response)
            : await interaction.reply(response);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Erro ao executar comando "${interaction.commandName}":`, error);
        const response = { content: 'Ocorreu um erro ao executar este comando!', ephemeral: true };
        interaction.replied || interaction.deferred
            ? await interaction.followUp(response)
            : await interaction.reply(response);
    }
});

client.login(DISCORD_TOKEN);
