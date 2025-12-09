//setup
const readline = require('readline');
const fs = require('fs');
const crypto = require("crypto");

const uuid = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

//manually promisify this (util didn't work)
const question = (prompt, def = null) => {
	return new Promise((resolve, reject) => {
		rl.question(`${prompt}${def ? ` (${def})` : ''}: `, answer => {
			//loop on required
			if (def === null && !answer) {
				return resolve(question(prompt, def));
			}

			return resolve(answer || def);
		});
	});
};

//questions
(async () => {
	//project configuration
	const appName = await question('App Name', 'chat');
	const appWebAddress = await question('Web Addr', `${appName}.example.com`);
	const appWebOrigin = await question('Web Origin', `https://example.com`); //TODO: clean these up properly
	const appPort = await question('App Port', '3300');

  //configure the database address
  let dbLocation = '';
  while (typeof dbLocation != 'string' || /^[le]/i.test(dbLocation[0]) == false) {
    dbLocation = await question('[l]ocal or [e]xternal database?');
  }

  let appDBHost = '';
  let appDBPort = '';

  if (/^[l]/i.test(dbLocation[0])) {
    appDBHost = 'database';
    appDBPort = '3306';
  }
  else {
    appDBHost = await question('DB Host');
    appDBPort = await question('DB Port', '3306');
  }

  //configure the database account
	const appDBUser = await question('DB User', appName);
	const appDBPass = await question('DB Pass', 'blastoise');
	const dbRootPass = await question('DB Root Pass');

	const appSecretAccess = await question('Access Token Secret', uuid(32));

	const supportEmail = await question('Support Email', 'example@example.com');

	//generate the files
	const ymlfile = `
services:
  ${appName}:
    build:
      context: .
    ports:
      - ${appPort}
    labels:
      - traefik.enable=true
      - traefik.http.routers.${appName}router.rule=Host(\`${appWebAddress}\`)
      - traefik.http.routers.${appName}router.entrypoints=websecure
      - traefik.http.routers.${appName}router.tls.certresolver=myresolver
      - traefik.http.routers.${appName}router.service=${appName}service@docker
      - traefik.http.services.${appName}service.loadbalancer.server.port=${appPort}
    environment:
      - WEB_PORT=${appPort}
      - WEB_ORIGIN=${appWebOrigin}
      - DB_HOSTNAME=${appDBHost}
      - DB_PORTNAME=${appDBPort}
      - DB_DATABASE=${appName}
      - DB_USERNAME=${appDBUser}
      - DB_PASSWORD=${appDBPass}
      - DB_TIMEZONE=Australia/Sydney
      - SECRET_ACCESS=${appSecretAccess}
    volumes:
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    networks:
      - app-network${ appDBHost != 'database' ? '' : `
    depends_on:
      - database

  database:
    image: mariadb:latest
    environment:
      MYSQL_DATABASE: ${appName}
      MYSQL_TCP_PORT: ${appDBPort}
      MYSQL_USER: ${appDBUser}
      MYSQL_PASSWORD: ${appDBPass}
      MYSQL_ROOT_PASSWORD: ${dbRootPass}
    networks:
      - app-network
    volumes:
      - ./mysql:/var/lib/mysql
      - ./startup.sql:/docker-entrypoint-initdb.d/startup.sql:ro
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro`}

  traefik_${appName}:
    container_name: ${appName}_traefik
    image: traefik:v2.10
    container_name: traefik
    command:
      - --log.level=ERROR
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.myresolver.acme.tlschallenge=true
      - --certificatesresolvers.myresolver.acme.email=${supportEmail}
      - --certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./letsencrypt:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
`;

	const dockerfile = `
FROM node:22-bookworm-slim
WORKDIR "/app"
COPY package*.json ./
RUN npm install --omit=dev
COPY . /app
EXPOSE ${appPort}
USER node
ENTRYPOINT ["bash", "-c"]
CMD ["sleep 10 && npm start"]
`;

	const sqlfile = `
CREATE DATABASE IF NOT EXISTS ${appName};
CREATE USER IF NOT EXISTS '${appDBUser}'@'%' IDENTIFIED BY '${appDBPass}';
GRANT ALL PRIVILEGES ON ${appName}.* TO '${appDBUser}'@'%';
`;

	fs.writeFileSync('docker-compose.yml', ymlfile);
	fs.writeFileSync('Dockerfile', dockerfile);
	fs.writeFileSync('startup.sql', sqlfile);
})()
	.then(() => rl.close())
	.catch(e => console.error(e))
;
