package com.carlos.gamificationservice.integration;

import com.carlos.gamificationservice.BaseIntegrationTest;
import org.junit.jupiter.api.Test;

import com.carlos.gamificationservice.models.UserStreak;
import com.carlos.gamificationservice.repository.UserStreakRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;


public class UserStreakIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserStreakRepository userStreakRepository;

    @Test
    public void testPostUserActivity_CreatesNewStreak() throws Exception {

        // No setup - user doesn't exist yet
        mockMvc.perform(post("/userStreak/postUserActivity")
                        .header("userName", "Ninja_Poliglota"))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentStreak").value(1))
                .andExpect(jsonPath("$.longestStreak").value(1));
    }

    @Test
    public void testPostUserActivity_IncrementsStreak() throws Exception {

        // Arrange - insert existing streak with activity yesterday
        UserStreak existing = new UserStreak();
        existing.setUserName("Ninja_Poliglota");
        existing.setCurrentStreak(1);
        existing.setLongestStreak(1);
        existing.setLastDateOfActivity(LocalDate.now().minusDays(1));
        userStreakRepository.save(existing);

        // Act & Assert
        mockMvc.perform(post("/userStreak/postUserActivity")
                        .header("userName", "Ninja_Poliglota"))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentStreak").value(2))
                .andExpect(jsonPath("$.longestStreak").value(2));
    }

    @Test
    public void testPostUserActivity_NoIncrementsLongestStreak() throws Exception {

        // Arrange - insert existing streak with activity yesterday
        UserStreak existing = new UserStreak();
        existing.setUserName("Ninja_Poliglota");
        existing.setCurrentStreak(1);
        existing.setLongestStreak(15);
        existing.setLastDateOfActivity(LocalDate.now().minusDays(1));
        userStreakRepository.save(existing);

        // Act & Assert
        mockMvc.perform(post("/userStreak/postUserActivity")
                        .header("userName", "Ninja_Poliglota"))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentStreak").value(2))
                .andExpect(jsonPath("$.longestStreak").value(15));
    }

    @Test
    public void testGetUserStreakData_ReturnsStreakData() throws Exception {

        // Arrange
        UserStreak existing = new UserStreak();
        existing.setUserName("Ninja_Poliglota");
        existing.setCurrentStreak(7);
        existing.setLongestStreak(15);
        existing.setLastDateOfActivity(LocalDate.now());
        userStreakRepository.save(existing);

        // Act & Assert
        mockMvc.perform(get("/userStreak/getUserStreakData")
                        .header("userName", "Ninja_Poliglota"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(7))
                .andExpect(jsonPath("$.longestStreak").value(15));
    }

}
