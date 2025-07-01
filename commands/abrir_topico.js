const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abrir_topico')
        .setDescription('Abre um novo tópico com um título e mensagem.')
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('O título do tópico (máximo 98 caracteres, incluindo emoji).')
                .setRequired(true)
                .setMaxLength(98))
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('A mensagem inicial do tópico.')
                .setRequired(true)),
    async execute(interaction) {
        // CORREÇÃO AQUI: Usando flags: 64 para o deferReply (efêmero)
        await interaction.deferReply({ flags: 64 });

        const titulo = interaction.options.getString('titulo');
        const mensagem = interaction.options.getString('mensagem');

        if (interaction.channel.type !== ChannelType.GuildText && interaction.channel.type !== ChannelType.GuildForum) {
            // Esta mensagem de erro já era editReply, então não precisa de flags: 64 aqui,
            // pois o deferReply já a tornou efêmera.
            return interaction.editReply({ content: 'Este comando só pode ser usado em canais de texto ou fóruns.' });
        }

        const threadTitle = `🔵 ${titulo}`;

        try {
            // Opcional: Mostrar uma mensagem de "carregando" mais descritiva
            await interaction.editReply({ content: '⏳ Criando o tópico...' });

            const newThread = await interaction.channel.threads.create({
                name: threadTitle,
                type: ChannelType.PublicThread,
                reason: `Tópico aberto por ${interaction.user.tag}`,
            });

            await newThread.send(mensagem);

            // CORREÇÃO AQUI: Removido 'ephemeral: false'. Mensagens editadas após deferReply
            // são públicas por padrão, a menos que especificado 'flags: 64'.
            await interaction.editReply({ content: `Tópico '${newThread.name}' criado com sucesso em ${newThread.toString()}!` });
        } catch (error) {
            console.error('Erro ao criar tópico:', error);
            if (error.code === 50013) {
                // Esta mensagem de erro já era editReply, então não precisa de flags: 64 aqui,
                // pois o deferReply já a tornou efêmera.
                await interaction.editReply({ content: 'Não tenho permissão para criar tópicos neste canal. Verifique as permissões do bot.' });
            } else {
                // Esta mensagem de erro já era editReply, então não precisa de flags: 64 aqui,
                // pois o deferReply já a tornou efêmera.
                await interaction.editReply({ content: `Ocorreu um erro ao criar o tópico: ${error.message}` });
            }
        }
    },
};