package com.carlos.gamificationservice.dtos.dtosImpl;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EnrichedPhraseDTO {
    private Integer phrase_id;
    private String word;
    private String sentence;
    private String correct_answer;
    private List<String> distractors;
    private String level;
    private String language;
}
