FROM readytalk/nodejs

RUN echo 'starting to build eddie the iot bot'

WORKDIR /app
ADD package.json /app/
RUN npm install
ADD . /app

CMD []
ENTRYPOINT ["/nodejs/bin/npm", "start"]