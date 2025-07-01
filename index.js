require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, ChannelType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // <--- NOVA CONSTANTE AQUI, LENDO DO .env

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
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
        if (command && typeof command.data === 'object' && typeof command.execute === 'function' &&
            typeof command.data.name === 'string' && command.data.name.length > 0) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[AVISO] O arquivo de comando ${file} está mal formatado ou faltando propriedades essenciais (data, execute, data.name). Ele será ignorado.`);
        }
    } catch (error) {
        console.error(`[ERRO] Falha ao carregar o comando ${file}:`, error);
    }
}

client.once('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}!`);

    const commandsToRegister = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());

    try {
        //await client.application.commands.set([]);
        //console.log("Todos os comandos slash globais foram limpos com sucesso!");
        // --- Opções de Sincronização de Comandos ---
        // Escolha APENAS UMA das opções abaixo (global ou específica de guild).

        // OPÇÃO 1: SINCRONIZAÇÃO GLOBAL (RECOMENDADO PARA PRODUÇÃO)
        // Os comandos levam de 15 min a 1 hora para aparecerem.
        // Descomente a linha abaixo para usar a sincronização global.
        // await client.application.commands.set(commandsToRegister);
        // console.log("Comandos slash sincronizados globalmente!");

        // OPÇÃO 2: SINCRONIZAÇÃO EM GUILD ESPECÍFICA (RECOMENDADO PARA TESTES)
        // Os comandos aparecem quase instantaneamente na guild especificada.
        // COMENTE A SINCRONIZAÇÃO GLOBAL ACIMA SE USAR ESTA OPÇÃO.
        
        // Agora lê diretamente da variável de ambiente GUILD_ID
        if (GUILD_ID && GUILD_ID.length > 5) { // Um ID de guild tem pelo menos 18 dígitos, 5 é um valor seguro
            const guild = await client.guilds.fetch(GUILD_ID).catch((err) => { // <--- USANDO GUILD_ID DA VAR. DE AMBIENTE
                console.error(`Erro ao buscar a guild ${GUILD_ID}:`, err.message);
                return null;
            });

            if (guild) {
                await guild.commands.set(commandsToRegister);
                console.log(`Comandos slash sincronizados na guild ${guild.name}!`);
            } else {
                console.warn(`Guild com ID "${GUILD_ID}" não encontrada. Verifique se o bot está no servidor e o ID está correto.`);
            }
        } else {
            console.warn('Variável de ambiente GUILD_ID não configurada corretamente. Comandos não serão sincronizados em uma guild específica.');
            console.warn('Para sincronizar globalmente (e demorar mais), comente a parte de sincronização de guild.');
        }

    } catch (error) {
        console.error('Erro ao sincronizar comandos slash:', error);
        if (error.rawError && error.rawError.errors) {
            console.error('Detalhes do erro do Discord:', JSON.stringify(error.rawError.errors, null, 2));
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Nenhum comando encontrado para ${interaction.commandName}.`);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Comando não encontrado.', flags: 64 });
        } else {
            await interaction.reply({ content: 'Comando não encontrado.', flags: 64 });
        }
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Erro ao executar comando ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', flags: 64 });
        } else {
            await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', flags: 64 });
        }
    }
});

client.login(DISCORD_TOKEN);