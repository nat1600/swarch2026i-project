package com.carlos.gamificationservice.integration;

import com.carlos.gamificationservice.BaseIntegrationTest;
import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import com.carlos.gamificationservice.repository.UserGameSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests verifying that the three new p2 game names
 * (fill-in-the-word, stopwatch, matching) are correctly persisted
 * and retrievable through the UserGameSession API.
 */
public class NewGamesIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserGameSessionRepository userGameSessionRepository;

    private final String userName = "parla_test_user";
    private final LocalDate today = LocalDate.now();

    private String toJson(Object obj) throws Exception {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .writeValueAsString(obj);
    }

    // ─── fill-in-the-word ────────────────────────────────────────────────────

    @Test
    public void testSaveSession_FillInTheWord_Success() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, "fill-in-the-word", 100, today);

        mockMvc.perform(post("/userGameSession/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(dto)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userName").value(userName))
                .andExpect(jsonPath("$.gamePlayed").value("fill-in-the-word"))
                .andExpect(jsonPath("$.points").value(100));
    }

    @Test
    public void testSaveSession_FillInTheWord_WithHintPoints() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, "fill-in-the-word", 60, today);

        mockMvc.perform(post("/userGameSession/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(dto)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.points").value(60));
    }

    // ─── stopwatch ───────────────────────────────────────────────────────────

    @Test
    public void testSaveSession_Stopwatch_Success() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, "stopwatch", 350, today);

        mockMvc.perform(post("/userGameSession/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(dto)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.gamePlayed").value("stopwatch"))
                .andExpect(jsonPath("$.points").value(350));
    }

    @Test
    public void testSaveSession_Stopwatch_ZeroPoints() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, "stopwatch", 0, today);

        mockMvc.perform(post("/userGameSession/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(dto)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.points").value(0));
    }

    // ─── matching ────────────────────────────────────────────────────────────

    @Test
    public void testSaveSession_Matching_Success() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, "matching", 450, today);

        mockMvc.perform(post("/userGameSession/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(dto)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.gamePlayed").value("matching"))
                .andExpect(jsonPath("$.points").value(450));
    }

    // ─── multi-game session retrieval ─────────────────────────────────────────

    @Test
    public void testGetAllSessions_ReturnsAllThreeNewGameTypes() throws Exception {
        // Arrange — save one session of each new game type
        saveDirectly("fill-in-the-word", 100);
        saveDirectly("stopwatch", 250);
        saveDirectly("matching", 375);

        mockMvc.perform(get("/userGameSession/getAllUserGameSessions")
                        .param("userName", userName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        // Verify persisted game names
        List<UserGameSession> sessions = userGameSessionRepository.getAllByUserName(userName);
        assertThat(sessions).extracting(UserGameSession::getGamePlayed)
                .containsExactlyInAnyOrder("fill-in-the-word", "stopwatch", "matching");
    }

    @Test
    public void testGetSessionsByDate_OnlyReturnsNewGameSessionsOnDate() throws Exception {
        // Arrange — save sessions today + yesterday
        saveDirectly("fill-in-the-word", 100);
        saveDirectlyOnDate("stopwatch", 200, today.minusDays(1));

        mockMvc.perform(get("/userGameSession/getAllUserGameSessionsPerDate")
                        .param("userName", userName)
                        .param("intendedDate", today.toString()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].gamePlayed").value("fill-in-the-word"));
    }

    @Test
    public void testGetSessionsByPoints_FiltersByExactPoints() throws Exception {
        // Arrange — multiple sessions with different scores
        saveDirectly("fill-in-the-word", 100);
        saveDirectly("stopwatch", 50);
        saveDirectly("matching", 75);

        mockMvc.perform(get("/userGameSession/getAllUserGameSessionsPerPoints")
                        .param("userName", userName)
                        .param("intendedPoints", "100"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].gamePlayed").value("fill-in-the-word"));
    }

    @Test
    public void testTotalXP_SumsAcrossNewGameTypes() throws Exception {
        // Arrange — 100 + 250 + 375 = 725 total XP
        saveDirectly("fill-in-the-word", 100);
        saveDirectly("stopwatch", 250);
        saveDirectly("matching", 375);

        List<UserGameSession> sessions = userGameSessionRepository.getAllByUserName(userName);
        int totalXP = sessions.stream().mapToInt(UserGameSession::getPoints).sum();
        assertThat(totalXP).isEqualTo(725);
    }

    @Test
    public void testDeleteAllSessions_RemovesAllNewGameSessions() throws Exception {
        // Arrange
        saveDirectly("fill-in-the-word", 100);
        saveDirectly("stopwatch", 250);
        saveDirectly("matching", 375);

        mockMvc.perform(delete("/userGameSession/deleteAllUserGameSessions")
                        .param("userName", userName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true));

        List<UserGameSession> remaining = userGameSessionRepository.getAllByUserName(userName);
        assertThat(remaining).isEmpty();
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private void saveDirectly(String gameName, int points) {
        saveDirectlyOnDate(gameName, points, today);
    }

    private void saveDirectlyOnDate(String gameName, int points, LocalDate date) {
        UserGameSession s = new UserGameSession();
        s.setUserName(userName);
        s.setGamePlayed(gameName);
        s.setPoints(points);
        s.setSessionDate(date);
        userGameSessionRepository.save(s);
    }
}
