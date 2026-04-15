package com.loxia.rental.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient authRestClient(@Value("${services.auth-url}") String authUrl) {
        return RestClient.builder()
                .baseUrl(authUrl)
                .requestFactory(timeoutFactory())
                .build();
    }

    @Bean
    public RestClient catalogRestClient(@Value("${services.catalog-url}") String catalogUrl) {
        return RestClient.builder()
                .baseUrl(catalogUrl)
                .requestFactory(timeoutFactory())
                .build();
    }

    private SimpleClientHttpRequestFactory timeoutFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(3));
        return factory;
    }
}
