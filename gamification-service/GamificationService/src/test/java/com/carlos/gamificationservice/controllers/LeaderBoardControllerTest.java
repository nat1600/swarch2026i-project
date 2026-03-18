package com.carlos.gamificationservice.controllers;

import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;

import com.carlos.gamificationservice.services.LeaderBoardService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.redis.core.DefaultTypedTuple;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LeaderBoardController.class) // -> Loads the application necessary to test the endpoint we want.
@AutoConfigureMockMvc(addFilters = false)
public class LeaderBoardControllerTest {

    String baseUrl = "/leaderBoard";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeaderBoardService leaderBoardService;


    // ===================== POST /incrementScore =====================

    @Test
    public void testIncrementScore_Success() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        Integer newExp = 100;
        BooleanDTO booleanDTO = new BooleanDTO(true);

        when(leaderBoardService.incrementScore(userId, newExp)).thenReturn(booleanDTO);

        mockMvc.perform(post(baseUrl + "/incrementScore")
                        .header("userId", userId)
                        .param("newExp", newExp.toString())
                        .characterEncoding("UTF-8"))
                .andExpect(jsonPath("$.status").value(true))
                .andExpect(status().isCreated());
    }

    @Test
    public void testIncrementScore_Failure() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        Integer newExp = 100;
        BooleanDTO booleanDTO = new BooleanDTO(false);

        when(leaderBoardService.incrementScore(userId, newExp)).thenReturn(booleanDTO);

        mockMvc.perform(post(baseUrl + "/incrementScore")
                        .header("userId", userId)
                        .param("newExp", newExp.toString())
                        .characterEncoding("UTF-8"))
                .andExpect(jsonPath("$.status").value(false))
                .andExpect(status().isInternalServerError());
    }

    // ===================== GET /getLeaderBoard =====================

    @Test
    public void testGetLeaderBoard_Success() throws Exception { // OK

        LocalDate currentWeek = LocalDate.now();
        int year = currentWeek.get(IsoFields.WEEK_BASED_YEAR);
        int weekOfTheYear = currentWeek.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        List<ZSetOperations.TypedTuple<String>> leaderBoard = List.of(
                new DefaultTypedTuple<>("Ninja_Poliglota", 100.0),
                new DefaultTypedTuple<>("Pedro_Sanchez", 80.0),
                new DefaultTypedTuple<>("Carlos_Dev", 60.0)
        );

        when(leaderBoardService.getTopNUsers(year, weekOfTheYear, 15)).thenReturn(leaderBoard);

        mockMvc.perform(get(baseUrl + "/getLeaderBoard"))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(status().isOk());
    }

    @Test
    public void testGetLeaderBoard_ReturnsEmpty() throws Exception { // OK

        LocalDate currentWeek = LocalDate.now();
        int year = currentWeek.get(IsoFields.WEEK_BASED_YEAR);
        int weekOfTheYear = currentWeek.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        when(leaderBoardService.getTopNUsers(year, weekOfTheYear, 15)).thenReturn(List.of());

        mockMvc.perform(get(baseUrl + "/getLeaderBoard"))
                .andExpect(jsonPath("$.length()").value(0))
                .andExpect(status().isOk());
    }

    // ===================== GET /getUserRank =====================

    @Test
    public void testGetUserRank_Success() throws Exception { // OK

        String userName = "Ninja_Poliglota";
        LocalDate currentWeek = LocalDate.now();
        int year = currentWeek.get(IsoFields.WEEK_BASED_YEAR);
        int weekOfTheYear = currentWeek.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        when(leaderBoardService.getUserScore(userName, year, weekOfTheYear)).thenReturn(100);
        when(leaderBoardService.getUserRank(userName, year, weekOfTheYear)).thenReturn(1L);

        mockMvc.perform(get(baseUrl + "/getUserRank")
                        .header("userName", userName))
                .andExpect(jsonPath("$.userName").value("Ninja_Poliglota"))
                .andExpect(jsonPath("$.score").value(100))
                .andExpect(jsonPath("$.rank").value(1l))
                .andExpect(status().isOk());
    }

    @Test
    public void testGetUserRank_UserWithNoScore() throws Exception {

        String userName = "Ninja_Poliglota";
        LocalDate currentWeek = LocalDate.now();
        int year = currentWeek.get(IsoFields.WEEK_BASED_YEAR);
        int weekOfTheYear = currentWeek.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        when(leaderBoardService.getUserScore(userName, year, weekOfTheYear)).thenReturn(0);
        when(leaderBoardService.getUserRank(userName, year, weekOfTheYear)).thenReturn(0L);

        mockMvc.perform(get(baseUrl + "/getUserRank")
                        .header("userName", userName))
                .andExpect(jsonPath("$.userName").value("Ninja_Poliglota"))
                .andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.rank").value(0))
                .andExpect(status().isOk());
    }
}
