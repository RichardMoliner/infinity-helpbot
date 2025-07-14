FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Variáveis de ambiente para teste (em produção serão definidas via ECS)
ENV DISCORD_TOKEN='MTM4NTYxMDkyMzM0NzE1MzE2OQ.GZ1yev.QI1fqcLig_u3knYbvgnUWA20ASv1-krILyhlBg'
ENV CLIENT_ID='1385610923347153169'
ENV GUILD_ID='1385729023405064202'

CMD ["node", "index.js"] 