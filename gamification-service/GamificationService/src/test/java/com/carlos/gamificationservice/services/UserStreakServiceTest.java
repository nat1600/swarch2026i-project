package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.dtos.UserStreakMapper;
import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.models.UserStreak;
import com.carlos.gamificationservice.repository.UserStreakRepository;
import com.carlos.gamificationservice.services.servicesImpl.UserStreakServiceImplementation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

// KEY TAKEAWAY
// @ExtendWith(MockitoExtension.class) --> better for unit tests since it processes simple mocking annotations.
// @ExtendWith(SpringExtension.class) --> better for integration tests since it loads the full application context.
@ExtendWith(MockitoExtension.class)
public class UserStreakServiceTest {

    @Mock
    private UserStreakRepository userStreakRepository;

    @Mock
    private UserStreakMapper userStreakMapper;

    @InjectMocks
    private UserStreakServiceImplementation userStreakServiceImplementation;


    @Test
    public void testRegisterUserActivity1() throws Exception {

        LocalDate today = LocalDate.now();

        UserStreak newUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 1, today);
        UserStreakDTO userStreakDTO = new UserStreakDTO(1,1);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(null)
                .thenReturn(newUserActivity);

        when(userStreakMapper.toUserStreakDTO(newUserActivity)).thenReturn(userStreakDTO);

        // Mockito handles this bi itself, hence we don't need to mock this kind of methods were nothing is returned.
        //doNothing().when(userStreakRepository).save(newUserActivity);

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getLongestStreak());

    }

    @Test
    public void testRegisterUserActivity2() throws Exception {

        LocalDate lastDayOfActivity = LocalDate.now().minusDays(1);

        UserStreak currentUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 1, lastDayOfActivity);
        UserStreak updatedUserActivity = new UserStreak(1L,"Ninja_Poliglota", 2, 2, lastDayOfActivity.plusDays(1));

        UserStreakDTO userStreakDTO = new UserStreakDTO(2,2);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(currentUserActivity)
                .thenReturn(updatedUserActivity);

        when(userStreakMapper.toUserStreakDTO(updatedUserActivity)).thenReturn(userStreakDTO);

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(2, result.getCurrentStreak());
        assertEquals(2, result.getLongestStreak());

    }

    @Test
    public void testRegisterUserActivity3() throws Exception {

        LocalDate lastDayOfActivity = LocalDate.now().minusDays(1);

        UserStreak currentUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 15, lastDayOfActivity);
        UserStreak updatedUserActivity = new UserStreak(1L,"Ninja_Poliglota", 2, 15, lastDayOfActivity.plusDays(1));

        UserStreakDTO userStreakDTO = new UserStreakDTO(2,15);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(currentUserActivity)
                .thenReturn(updatedUserActivity);

        when(userStreakMapper.toUserStreakDTO(updatedUserActivity)).thenReturn(userStreakDTO);

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(2, result.getCurrentStreak());
        assertEquals(15, result.getLongestStreak());

    }

    @Test
    public void testRegisterUserActivity4() throws Exception {

        LocalDate lastDayOfActivity = LocalDate.now().minusDays(15);

        UserStreak currentUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 15, lastDayOfActivity);
        UserStreak updatedUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 15, lastDayOfActivity.plusDays(15));

        UserStreakDTO userStreakDTO = new UserStreakDTO(1,15);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(currentUserActivity)
                .thenReturn(updatedUserActivity);

        when(userStreakMapper.toUserStreakDTO(updatedUserActivity)).thenReturn(userStreakDTO);

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(1, result.getCurrentStreak());
        assertEquals(15, result.getLongestStreak());

    }

    @Test
    public void getUserActivity() throws Exception {

        UserStreak currentUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 15, LocalDate.now());

        UserStreakDTO userStreakDTO = new UserStreakDTO(1,15);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(currentUserActivity);

        when(userStreakMapper.toUserStreakDTO(currentUserActivity)).thenReturn(userStreakDTO);

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(1, result.getCurrentStreak());
        assertEquals(15, result.getLongestStreak());

    }
}
