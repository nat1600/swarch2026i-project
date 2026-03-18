package com.carlos.gamificationservice.dtos;

import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.models.UserStreak;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserStreakMapper {
    UserStreakDTO toUserStreakDTO(UserStreak userStreak);
}
