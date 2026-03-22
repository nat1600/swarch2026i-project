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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class UserGameSessionIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserGameSessionRepository userGameSessionRepository;

    private final String userName = "Ninja_Poliglota";
    private final LocalDate sessionDate = LocalDate.of(2024, 3, 11);

    private String toJson(Object obj) throws Exception {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .writeValueAsString(obj);
    }

    private UserGameSession buildAndSaveSession(String userName, String gamePlayed, int points, LocalDate date) {
        UserGameSession session = new UserGameSession();
        session.setUserName(userName);
        session.setGamePlayed(gamePlayed);
        session.setPoints(points);
        session.setSessionDate(date);
        return userGameSessionRepository.save(session);
    }

    // ===================== POST /saveGameSession =====================

    @Test
    public void testSaveGameSession_Success() throws Exception {

        UserGameSessionDTO dto = new UserGameSessionDTO(userName, "Chess", 12, sessionDate);

        mockMvc.perform(post("/userGameSession/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(dto)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userName").value(userName))
                .andExpect(jsonPath("$.gamePlayed").value("Chess"))
                .andExpect(jsonPath("$.points").value(12));
    }

    // ===================== DELETE /deleteAllUserGameSessions =====================

    @Test
    public void testDeleteAllUserGameSessions_Success() throws Exception {

        // Arrange - insert sessions into H2
        buildAndSaveSession(userName, "Chess", 12, sessionDate);
        buildAndSaveSession(userName, "Chess", 20, sessionDate.plusDays(1));

        // Act & Assert
        mockMvc.perform(delete("/userGameSession/deleteAllUserGameSessions")
                        .header("userName", userName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true));

        // Verify they were actually deleted from H2
        List<UserGameSession> remaining = userGameSessionRepository.getAllByUserName(userName);
        assert remaining.isEmpty();
    }

    // ===================== DELETE /deleteAllUserGameSessionsPerDate =====================

    @Test
    public void testDeleteAllUserGameSessionsPerDate_Success() throws Exception {

        // Arrange - insert sessions on different dates
        buildAndSaveSession(userName, "Chess", 12, sessionDate);
        buildAndSaveSession(userName, "Chess", 20, sessionDate.plusDays(1));

        // Act & Assert - only delete sessions on sessionDate
        mockMvc.perform(delete("/userGameSession/deleteAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", sessionDate.toString()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true));

        // Verify only the session on sessionDate was deleted
        List<UserGameSession> remaining = userGameSessionRepository.getAllByUserName(userName);
        assert remaining.size() == 1;
        assert remaining.get(0).getSessionDate().equals(sessionDate.plusDays(1));
    }

    // ===================== GET /getAllUserGameSessions =====================

    @Test
    public void testGetAllUserGameSessions_ReturnsList() throws Exception {

        // Arrange
        buildAndSaveSession(userName, "Chess", 12, sessionDate);
        buildAndSaveSession(userName, "Chess", 20, sessionDate.plusDays(1));

        // Act & Assert
        mockMvc.perform(get("/userGameSession/getAllUserGameSessions")
                        .header("userName", userName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    public void testGetAllUserGameSessions_ReturnsEmpty() throws Exception {

        // No setup - no sessions exist for this user
        mockMvc.perform(get("/userGameSession/getAllUserGameSessions")
                        .header("userName", userName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ===================== GET /getAllUserGameSessionsPerDate =====================

    @Test
    public void testGetAllUserGameSessionsPerDate_ReturnsList() throws Exception {

        // Arrange - insert sessions on different dates
        buildAndSaveSession(userName, "Chess", 12, sessionDate);
        buildAndSaveSession(userName, "Chess", 20, sessionDate.plusDays(1));

        // Act & Assert - only sessions on sessionDate should be returned
        mockMvc.perform(get("/userGameSession/getAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", sessionDate.toString()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].points").value(12));
    }

    @Test
    public void testGetAllUserGameSessionsPerDate_ReturnsEmpty() throws Exception {

        // No sessions on this date
        mockMvc.perform(get("/userGameSession/getAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", sessionDate.toString()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ===================== GET /getAllUserGameSessionsPerPoints =====================

    @Test
    public void testGetAllUserGameSessionsPerPoints_ReturnsList() throws Exception {

        // Arrange
        buildAndSaveSession(userName, "Chess", 100, sessionDate);
        buildAndSaveSession(userName, "Chess", 50, sessionDate.plusDays(1));

        // Act & Assert - only sessions with 100 points should be returned
        mockMvc.perform(get("/userGameSession/getAllUserGameSessionsPerPoints")
                        .header("userName", userName)
                        .param("intendedPoints", "100"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].points").value(100));
    }

    @Test
    public void testGetAllUserGameSessionsPerPoints_ReturnsEmpty() throws Exception {

        // No sessions with these points
        mockMvc.perform(get("/userGameSession/getAllUserGameSessionsPerPoints")
                        .header("userName", userName)
                        .param("intendedPoints", "999"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}