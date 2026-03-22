package com.carlos.gamificationservice;

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest                                      // loads the full Spring context
@AutoConfigureMockMvc(addFilters = false)            // sets up MockMvc with the real context
@Transactional                                       // rolls back DB changes after each test
@ActiveProfiles("test")                              // ← tells Spring to load application-test.properties
public class BaseIntegrationTest {

}
