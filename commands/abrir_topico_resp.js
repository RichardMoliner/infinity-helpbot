const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abrir_topico_resp')
        .setDescription('Abre um novo tópico e já o atribui a um responsável.')
        .addStringOption(option =>
            option.setName('iniciais')
                .setDescription('As 2 primeiras letras do nome do responsável (ex: AB).')
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(2))
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('O título do tópico (máximo 89 caracteres, incluindo prefixo).')
                .setRequired(true)
                .setMaxLength(89))
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('A mensagem inicial do tópico.')
                .setRequired(true)),
    async execute(interaction) {
        // Início do "loading": Adia a resposta, visível apenas para o usuário que digitou o comando
        await interaction.deferReply({ flags: 64 }); // flags: 64 para ser efêmero

        const iniciais = interaction.options.getString('iniciais').toUpperCase();
        const titulo = interaction.options.getString('titulo');
        const mensagem = interaction.options.getString('mensagem');

        if (interaction.channel.type !== ChannelType.GuildText && interaction.channel.type !== ChannelType.GuildForum) {
            // Edita a resposta adiada com a mensagem de erro
            return interaction.editReply({ content: 'Este comando só pode ser usado em canais de texto ou fóruns.' });
        }
        
        const threadTitle = `🟡 [${iniciais}] - ${titulo}`;

        try {
            // Opcional: Mostrar uma mensagem de "carregando" mais descritiva
            await interaction.editReply({ content: '⏳ Criando e atribuindo o tópico...' });

            // PASSO 1: Criar o tópico SEM a propriedade 'message'
            const newThread = await interaction.channel.threads.create({
                name: threadTitle,
                type: ChannelType.PublicThread,
                reason: `Tópico aberto e atribuído a ${iniciais} por ${interaction.user.tag}`,
            });

            // PASSO 2: Enviar a mensagem separadamente para o tópico recém-criado
            await newThread.send(mensagem);

            // Edita a resposta adiada com a mensagem de sucesso.
            // A mensagem final aqui será PÚBLICA (não efêmera), pois é um aviso de sucesso.
            await interaction.editReply({ content: `Tópico '${newThread.name}' criado e atribuído a **${iniciais}** em ${newThread.toString()}!` });
        } catch (error) {
            console.error('Erro ao criar tópico com responsável:', error);
            if (error.code === 50013) {
                // Edita a resposta adiada com a mensagem de erro de permissão
                await interaction.editReply({ content: 'Não tenho permissão para criar tópicos neste canal. Verifique as permissões do bot.' });
            } else {
                // Edita a resposta adiada com a mensagem de erro geral
                await interaction.editReply({ content: `Ocorreu um erro ao criar o tópico: ${error.message}` });
            }
        }
    },
};