package com.carlos.gamificationservice.controllers;

import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.services.UserStreakService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(UserStreakController.class) // -> Loads the application necessary to test the endpoint we want.
@AutoConfigureMockMvc(addFilters = false) // -> Disable Spring security filter chain.
public class UserStreakControllerTest {

    String baseUrl = "/userStreak";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserStreakService userStreakService;

    @Test
    public void testPostUserActivity1() throws Exception {

        String userName = "Pedro_Sánchez_11";
        UserStreakDTO userStreakDTO = new UserStreakDTO(12, 13);

        when(userStreakService.registerUserActivity(userName)).thenReturn(userStreakDTO);

        mockMvc.perform(post(baseUrl + "/postUserActivity")
                        .header("userName", userName)
                        .characterEncoding("UTF-8"))
                        .andExpect(jsonPath("$.currentStreak").value(12))
                        .andExpect(jsonPath("$.longestStreak").value(13))
                        .andExpect(status().isCreated());
    }

    @Test
    public void testPostUserActivity2() throws Exception {

        String userName = "Pedro_Sánchez_11";

        when(userStreakService.registerUserActivity(userName)).thenThrow(new RuntimeException("System Failure Simulation"));

        mockMvc.perform(post(baseUrl + "/postUserActivity")
                        .header("userName", userName)
                        .characterEncoding("UTF-8"))
                        .andExpect(status().isInternalServerError());
    }

    @Test
    public void testGetUserActivity() throws Exception {

        String userName = "Pedro_Sánchez_11";
        UserStreakDTO userStreakDTO = new UserStreakDTO(12, 13);

        when(userStreakService.getUserActivity(userName)).thenReturn(userStreakDTO);

        mockMvc.perform(get(baseUrl + "/getUserStreakData")
                        .header("userName", userName)
                        .characterEncoding("UTF-8"))
                .andExpect(jsonPath("$.currentStreak").value(12))
                .andExpect(jsonPath("$.longestStreak").value(13))
                .andExpect(status().isOk());
    }

}
