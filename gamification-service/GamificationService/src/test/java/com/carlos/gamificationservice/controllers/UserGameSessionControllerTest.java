package com.carlos.gamificationservice.controllers;


import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import com.carlos.gamificationservice.services.UserGameSessionService;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(UserGameSessionController.class) // -> Loads the application necessary to test the endpoint we want.
@AutoConfigureMockMvc(addFilters = false) // -> Disable Spring security filter chain.
public class UserGameSessionControllerTest {

    String baseUrl = "/userGameSession";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserGameSessionService userGameSessionService;

    private final String userName = "Ninja_Poliglota";
    private final LocalDate intendedDate = LocalDate.of(2024, 3, 11);
    private final String gamePlayed = "Crossword";

    // ===================== POST /saveGameSession =====================

    @Test
    public void testSaveGameSession_Success() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, gamePlayed , 12 , intendedDate);

        String requestBody = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .writeValueAsString(dto);

        when(userGameSessionService.saveUserGameSession(dto)).thenReturn(dto);

        mockMvc.perform(post(baseUrl + "/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody)
                        .characterEncoding("UTF-8"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userName").value(this.userName))
                .andExpect(jsonPath("$.gamePlayed").value(this.gamePlayed))
                .andExpect(jsonPath("$.points").value(12));
    }

    @Test
    public void testSaveGameSession_Failure() throws Exception {
        UserGameSessionDTO dto = new UserGameSessionDTO(userName, gamePlayed , 12 , intendedDate);

        String requestBody = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .writeValueAsString(dto);

        when(userGameSessionService.saveUserGameSession(dto)).thenReturn(null);

        mockMvc.perform(post(baseUrl + "/saveGameSession")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody)
                        .characterEncoding("UTF-8"))
                .andExpect(status().isInternalServerError());

    }

    // ===================== DELETE /deleteAllUserGameSessions =====================

    @Test
    public void testDeleteAllUserGameSessions_Success() throws Exception {
        BooleanDTO result = new BooleanDTO(true);
        when(userGameSessionService.deleteAllUserGameSessions(userName)).thenReturn(result);

        mockMvc.perform(delete(baseUrl + "/deleteAllUserGameSessions")
                        .header("userName", userName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true));
    }

    @Test
    public void testDeleteAllUserGameSessions_Failure() throws Exception {
        BooleanDTO result = new BooleanDTO(false);
        when(userGameSessionService.deleteAllUserGameSessions(userName)).thenReturn(result);

        mockMvc.perform(delete(baseUrl + "/deleteAllUserGameSessions")
                        .header("userName", userName))
                .andExpect(status().isInternalServerError());
    }

    // ===================== DELETE /deleteAllUserGameSessionsPerDate =====================

    @Test
    public void testDeleteAllUserGameSessionsPerDate_Success() throws Exception {
        BooleanDTO result = new BooleanDTO(true);
        when(userGameSessionService.deleteAllUserGameSessionsPerDate(userName, intendedDate)).thenReturn(result);
        // 2024-03-14
        mockMvc.perform(delete(baseUrl + "/deleteAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", intendedDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true));
    }

    @Test
    public void testDeleteAllUserGameSessionsPerDate_Failure() throws Exception {
        BooleanDTO result = new BooleanDTO(false);
        when(userGameSessionService.deleteAllUserGameSessionsPerDate(userName, intendedDate)).thenReturn(result);

        mockMvc.perform(delete(baseUrl + "/deleteAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", intendedDate.toString()))
                .andExpect(status().isInternalServerError());
    }

    // ===================== GET /getAllUserGameSessions =====================

    @Test
    public void testGetAllUserGameSessions_Success() throws Exception {
        List<UserGameSession> gameSessions = List.of(new UserGameSession(1L,userName,gamePlayed, 12, intendedDate), new UserGameSession(2L,userName,gamePlayed, 12, intendedDate));

        when(userGameSessionService.getAllUserGameSessions(userName)).thenReturn(gameSessions);

        mockMvc.perform(get(baseUrl + "/getAllUserGameSessions")
                        .header("userName", userName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    public void testGetAllUserGameSessions_Failure() throws Exception {
        when(userGameSessionService.getAllUserGameSessions(userName)).thenReturn(null);

        mockMvc.perform(get(baseUrl + "/getAllUserGameSessions")
                        .header("userName", userName))
                .andExpect(status().isInternalServerError());
    }

    // ===================== GET /getAllUserGameSessionsPerDate =====================

    @Test
    public void testGetAllUserGameSessionsPerDate_Success() throws Exception {
        List<UserGameSession> gameSessions = List.of(new UserGameSession(1L,userName,gamePlayed, 12, intendedDate), new UserGameSession(2L,userName,gamePlayed, 12, intendedDate));

        when(userGameSessionService.getAllUserGameSessionsPerDate(userName, intendedDate)).thenReturn(gameSessions);

        mockMvc.perform(get(baseUrl + "/getAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", intendedDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].gameSessionRecordId").value(1))
                .andExpect(jsonPath("$[0].points").value(12));
    }

    @Test
    public void testGetAllUserGameSessionsPerDate_Failure() throws Exception {
        when(userGameSessionService.getAllUserGameSessionsPerDate(userName, intendedDate)).thenReturn(null);

        mockMvc.perform(get(baseUrl + "/getAllUserGameSessionsPerDate")
                        .header("userName", userName)
                        .param("intendedDate", intendedDate.toString()))
                .andExpect(status().isInternalServerError());
    }

    // ===================== GET /getAllUserGameSessionsPerPoints =====================

    @Test
    public void testGetAllUserGameSessionsPerPoints_Success() throws Exception {
        List<UserGameSession> gameSessions = List.of(new UserGameSession(1L,userName,gamePlayed, 100, intendedDate), new UserGameSession(2L,userName,gamePlayed, 100, intendedDate));
        Integer intendedPoints = 100;

        when(userGameSessionService.getAllUserGameSessionsPerPoints(userName, intendedPoints)).thenReturn(gameSessions);

        mockMvc.perform(get(baseUrl + "/getAllUserGameSessionsPerPoints")
                        .header("userName", userName)
                        .param("intendedPoints", intendedPoints.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].gameSessionRecordId").value(1L))
                .andExpect(jsonPath("$[0].points").value(100));
    }

    @Test
    public void testGetAllUserGameSessionsPerPoints_Failure() throws Exception {
        Integer intendedPoints = 100;

        when(userGameSessionService.getAllUserGameSessionsPerPoints(userName, intendedPoints)).thenReturn(null);

        mockMvc.perform(get(baseUrl + "/getAllUserGameSessionsPerPoints")
                        .header("userName", userName)
                        .param("intendedPoints", intendedPoints.toString()))
                .andExpect(status().isInternalServerError());
    }
}