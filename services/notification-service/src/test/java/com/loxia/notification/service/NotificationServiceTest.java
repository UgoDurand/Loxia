package com.loxia.notification.service;

import com.loxia.notification.domain.Notification;
import com.loxia.notification.domain.NotificationType;
import com.loxia.notification.dto.CreateNotificationRequest;
import com.loxia.notification.dto.NotificationResponse;
import com.loxia.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UUID userId;
    private UUID notificationId;
    private UUID listingId;
    private UUID applicationId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        notificationId = UUID.randomUUID();
        listingId = UUID.randomUUID();
        applicationId = UUID.randomUUID();
    }

    private Notification sampleNotification(boolean read) {
        return Notification.builder()
                .id(notificationId)
                .userId(userId)
                .type(NotificationType.APPLICATION_CREATED)
                .title("Nouvelle candidature")
                .message("Hello world")
                .relatedListingId(listingId)
                .relatedApplicationId(applicationId)
                .read(read)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    // ─── create ───────────────────────────────────────────────────────────

    @Test
    void create_shouldPersistUnreadNotification() {
        CreateNotificationRequest request = new CreateNotificationRequest();
        request.setUserId(userId);
        request.setType(NotificationType.APPLICATION_ACCEPTED);
        request.setTitle("Candidature acceptée");
        request.setMessage("Bravo");
        request.setRelatedListingId(listingId);
        request.setRelatedApplicationId(applicationId);

        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> {
                    Notification n = inv.getArgument(0);
                    n.setId(notificationId);
                    n.setCreatedAt(OffsetDateTime.now());
                    return n;
                });

        NotificationResponse result = notificationService.create(request);

        assertThat(result.getId()).isEqualTo(notificationId);
        assertThat(result.isRead()).isFalse();
        assertThat(result.getType()).isEqualTo(NotificationType.APPLICATION_ACCEPTED);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().isRead()).isFalse();
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
        assertThat(captor.getValue().getTitle()).isEqualTo("Candidature acceptée");
    }

    // ─── getMyNotifications ───────────────────────────────────────────────

    @Test
    void getMyNotifications_shouldReturnRepositoryResults() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(sampleNotification(false), sampleNotification(true)));

        List<NotificationResponse> result = notificationService.getMyNotifications(userId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(notificationId);
        assertThat(result.get(0).getType()).isEqualTo(NotificationType.APPLICATION_CREATED);
    }

    @Test
    void getMyNotifications_shouldReturnEmptyListWhenNone() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        assertThat(notificationService.getMyNotifications(userId)).isEmpty();
    }

    // ─── getUnreadCount ───────────────────────────────────────────────────

    @Test
    void getUnreadCount_shouldReturnRepositoryCount() {
        when(notificationRepository.countByUserIdAndReadIsFalse(userId)).thenReturn(7L);

        assertThat(notificationService.getUnreadCount(userId)).isEqualTo(7L);
    }

    // ─── markAsRead ───────────────────────────────────────────────────────

    @Test
    void markAsRead_shouldFlipReadAndSave_whenOwnerAndUnread() {
        Notification unread = sampleNotification(false);
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(unread));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationResponse result = notificationService.markAsRead(notificationId, userId);

        assertThat(result.isRead()).isTrue();
        verify(notificationRepository).save(unread);
    }

    @Test
    void markAsRead_shouldBeIdempotent_whenAlreadyRead() {
        Notification alreadyRead = sampleNotification(true);
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(alreadyRead));

        NotificationResponse result = notificationService.markAsRead(notificationId, userId);

        assertThat(result.isRead()).isTrue();
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAsRead_shouldRejectWhenNotFound() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(notificationId, userId))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.NOT_FOUND);
    }

    @Test
    void markAsRead_shouldRejectWhenNotOwner() {
        UUID intruder = UUID.randomUUID();
        Notification unread = sampleNotification(false);
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(unread));

        assertThatThrownBy(() -> notificationService.markAsRead(notificationId, intruder))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.FORBIDDEN);
        verify(notificationRepository, never()).save(any());
    }

    // ─── markAllAsRead ────────────────────────────────────────────────────

    @Test
    void markAllAsRead_shouldReturnRepositoryUpdateCount() {
        when(notificationRepository.markAllAsReadForUser(userId)).thenReturn(4);

        assertThat(notificationService.markAllAsRead(userId)).isEqualTo(4);
        verify(notificationRepository).markAllAsReadForUser(userId);
    }
}
