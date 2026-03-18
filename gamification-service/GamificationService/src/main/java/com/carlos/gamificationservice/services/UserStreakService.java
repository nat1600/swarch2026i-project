package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;

public interface UserStreakService {

    UserStreakDTO registerUserActivity(String userName);
    UserStreakDTO getUserActivity(String userName);
}
