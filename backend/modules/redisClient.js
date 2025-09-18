const redis = require('redis');

const client = redis.createClient({
    username: 'default',
    password: 'Ix3jdykIJNLEMdHxUqbYLVmHETOfFX1w',
    socket: {
        host: 'redis-17733.crce182.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 17733
    }
});

client.on('error', err => console.log('Redis Client Error', err));

module.exports = {client};