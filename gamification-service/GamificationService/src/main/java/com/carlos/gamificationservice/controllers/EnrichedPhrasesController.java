package com.carlos.gamificationservice.controllers;

import com.carlos.gamificationservice.dtos.dtosImpl.EnrichedPhraseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/enriched-phrases")
public class EnrichedPhrasesController {

    private final RestTemplate restTemplate;
    private final String enrichmentServiceUrl;

    public EnrichedPhrasesController(
            RestTemplate restTemplate,
            @Value("${enrichment.service.url}") String enrichmentServiceUrl
    ) {
        this.restTemplate = restTemplate;
        this.enrichmentServiceUrl = enrichmentServiceUrl;
    }

    @GetMapping
    public ResponseEntity<List<EnrichedPhraseDTO>> getEnrichedPhrases(
            @RequestParam List<Integer> phrase_ids
    ) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(enrichmentServiceUrl + "/enriched-phrases");
        for (Integer id : phrase_ids) {
            builder.queryParam("phrase_ids", id);
        }

        ResponseEntity<List<EnrichedPhraseDTO>> response = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        return ResponseEntity.ok(response.getBody());
    }
}
