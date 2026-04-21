package com.carlos.gamificationservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

// Tells spring that this class will contain beans, so when the application starts spring will run the methods and
// manage the objects they return.
@Configuration
public class RedisConfig {

    @Bean // Call this method upon start up and handle the object it returns.
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) { // The RedisConnectionFactory
        // is an object automatically instantiated by spring and passed to our function. This object comes by default
        // when we first include the redis dependency.

        // This object is important because it knows how to physically open and manage the connection to our redis con-
        // tainer

        // The RedisTemplate<String, String> object is just a mere communication tool. Is the client that allows the
        // interaction with the database. The generics <String, String> just indicate how the information is going
        // to look like within our java code, and hence indicates how should we handle it.

        // In our case it is not necessary, (and I think it will never be) to use Integer within the generics. Bce we
        // would require an extra serializer for converting binary objects into readable things. And on the other hand
        // the conversion from String to Integer in our code is quite simple.
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);


        // Store both keys and values as plain strings
        // This makes data human-readable in Redis CLI
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());

        // Redis works out with two data structures, SortedSets and HashTables. Hence we need to configure all the seri
        // alizers within our client the redis-template.

        // To know which data structure we are using with redis we just have to check the methods we are calling.
        return template;
    }
}

