FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm i

# Bundle app source
COPY . /usr/src/app
ENV IOT_URI "https://f0cxgexai6.execute-api.us-west-2.amazonaws.com/prod"

CMD [ "npm", "start" ]
