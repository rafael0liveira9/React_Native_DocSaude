import telemedicinaService from "@/api/telemedicina";
import type { Specialty, Slot, SlotsResponse } from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Step = "specialty" | "date" | "time" | "professional";
type ScheduleMode = "byTime" | "byProfessional";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function AgendarConsultaScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>("specialty");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Step 1: Specialty
  const [specialties, setSpecialties] = useState<{ medical: Specialty[]; wellness: Specialty[] }>({ medical: [], wellness: [] });
  const [activeCategory, setActiveCategory] = useState<"medical" | "wellness">("medical");
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);

  // Schedule mode: by time or by professional
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("byTime");

  // Step 2 & 3: Date & Time
  const [slotsData, setSlotsData] = useState<SlotsResponse>({ slots: [], dates_available: [] });
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 4: Professional
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // By-professional mode: selected professional name first, then date/time
  const [selectedProfessionalName, setSelectedProfessionalName] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const id = await SecureStore.getItemAsync("user-id");
    if (id) {
      setUserId(parseInt(id));
      loadSpecialties(parseInt(id));
    }
  };

  // ---- STEP 1: Specialties ----
  const loadSpecialties = async (assinanteId: number) => {
    try {
      setLoading(true);
      const data = await telemedicinaService.getSpecialties(assinanteId);
      setSpecialties(data);
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      Toast.show({ type: "error", text1: "Erro ao carregar especialidades" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpecialty = async (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setScheduleMode("byTime");
    setSelectedProfessionalName(null);
    if (!userId) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const data = await telemedicinaService.getScheduleSlots(
        userId,
        specialty.speciality_id ?? undefined,
        specialty.occupation_id ?? undefined,
        today,
        30,
        specialty.program_id,
        'daysProgramCalendar'
      );
      setSlotsData(data);
      setCurrentStep("date");
    } catch (error) {
      console.error("Erro ao carregar slots:", error);
      Toast.show({ type: "error", text1: "Erro ao buscar horários disponíveis" });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = async (mode: ScheduleMode) => {
    if (mode === scheduleMode || !userId || !selectedSpecialty) return;

    setScheduleMode(mode);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlot(null);
    setSelectedProfessionalName(null);

    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const rule = mode === "byTime" ? "daysProgramCalendar" : "specialistSchedules";
      const data = await telemedicinaService.getScheduleSlots(
        userId,
        selectedSpecialty.speciality_id ?? undefined,
        selectedSpecialty.occupation_id ?? undefined,
        today,
        30,
        selectedSpecialty.program_id,
        rule
      );
      setSlotsData(data);
    } catch (error) {
      console.error("Erro ao carregar slots:", error);
      Toast.show({ type: "error", text1: "Erro ao buscar horários disponíveis" });
    } finally {
      setLoading(false);
    }
  };

  // List of unique professionals for "by professional" mode
  const uniqueProfessionals = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const slot of slotsData.slots) {
      const key = slot.professional_name || "unknown";
      if (!map.has(key)) {
        map.set(key, slot);
      }
    }
    return Array.from(map.values());
  }, [slotsData.slots]);

  // Slots filtered by selected professional
  const slotsForProfessional = useMemo(() => {
    if (!selectedProfessionalName) return { slots: [], dates_available: [] as string[] };
    const filtered = slotsData.slots.filter(
      (s) => s.professional_name === selectedProfessionalName
    );
    const dates = Array.from(new Set(filtered.map((s) => s.date))).sort();
    return { slots: filtered, dates_available: dates };
  }, [selectedProfessionalName, slotsData.slots]);

  const handleSelectProfessionalFirst = (name: string) => {
    setSelectedProfessionalName(name);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlot(null);
  };

  const currentSpecialties = activeCategory === "medical" ? specialties.medical : specialties.wellness;

  // ---- STEP 2: Calendar ----
  const datesAvailableSet = useMemo(
    () => new Set(slotsData.dates_available),
    [slotsData.dates_available]
  );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Array<{
      day: number;
      dateStr: string;
      isAvailable: boolean;
      isPast: boolean;
      isEmpty: boolean;
    }> = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, dateStr: "", isAvailable: false, isPast: false, isEmpty: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(calendarYear, calendarMonth, d);
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = dateObj < today;
      const isAvailable = !isPast && datesAvailableSet.has(dateStr);
      days.push({ day: d, dateStr, isAvailable, isPast, isEmpty: false });
    }

    return days;
  }, [calendarYear, calendarMonth, datesAvailableSet]);

  const goToPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSelectedSlot(null);
  };

  // ---- STEP 3: Time ----
  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    let sourceSlots = slotsData.slots;
    // In byProfessional mode, filter by selected professional
    if (scheduleMode === "byProfessional" && selectedProfessionalName) {
      sourceSlots = slotsForProfessional.slots;
    }
    const filtered = sourceSlots.filter((s) => s.date === selectedDate);
    const uniqueTimes = Array.from(new Set(filtered.map((s) => s.time))).sort();
    return uniqueTimes;
  }, [selectedDate, slotsData.slots, scheduleMode, selectedProfessionalName, slotsForProfessional.slots]);

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setSelectedSlot(null);
  };

  // ---- STEP 4: Professional ----
  const professionalsForSlot = useMemo(() => {
    if (!selectedDate || !selectedTime) return [];
    return slotsData.slots.filter(
      (s) => s.date === selectedDate && s.time === selectedTime
    );
  }, [selectedDate, selectedTime, slotsData.slots]);

  const handleSelectProfessional = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmAppointment = async () => {
    if (!userId || !selectedDate || !selectedTime || !selectedSlot || !selectedSpecialty) return;

    try {
      setLoading(true);
      await telemedicinaService.scheduleAppointment({
        assinanteId: userId,
        date: selectedDate,
        time: selectedTime,
        timestamp: selectedSlot.timestamp,
        userScheduleId: selectedSlot.user_schedule_id,
        specialityId: selectedSpecialty.speciality_id ?? undefined,
        specialityName: selectedSpecialty.speciality_name,
        occupationId: selectedSpecialty.occupation_id ?? undefined,
        professionalName: selectedSlot.professional_name,
        professionalCrm: selectedSlot.professional_crm,
        doubleBooking: selectedSlot.double_booking,
        programId: selectedSpecialty.program_id,
      });

      Toast.show({
        type: "success",
        text1: "Consulta agendada!",
        text2: `${selectedSpecialty.speciality_name} - ${formatDateBR(selectedDate)} as ${selectedTime}`,
      });
      router.back();
    } catch (error: any) {
      console.error("Erro ao confirmar agendamento:", error);
      Alert.alert(
        "Erro ao agendar",
        error.response?.data?.error || "Não foi possível confirmar o agendamento. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- Navigation ----
  const goBack = () => {
    switch (currentStep) {
      case "specialty":
        router.back();
        break;
      case "date":
        setCurrentStep("specialty");
        setSelectedDate(null);
        break;
      case "time":
        setCurrentStep("date");
        setSelectedTime(null);
        break;
      case "professional":
        setCurrentStep("time");
        setSelectedSlot(null);
        break;
    }
  };

  // ---- Helpers ----
  const formatDateBR = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}`;
  };

  // ---- RENDER ----
  if (loading && currentStep === "specialty" && specialties.medical.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Carregando especialidades...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: themeColors.text }]} numberOfLines={1}>
          {currentStep === "specialty" && "Selecione a especialidade"}
          {currentStep === "date" && (selectedSpecialty?.speciality_name || "Agendar Consulta")}
          {currentStep === "time" && (selectedSpecialty?.speciality_name || "Escolha o horário")}
          {currentStep === "professional" && "Escolher profissional"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {currentStep === "specialty" && renderStepSpecialty()}
      {currentStep === "date" && renderStepDate()}
      {currentStep === "time" && renderStepTime()}
      {currentStep === "professional" && renderStepProfessional()}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      )}
    </SafeAreaView>
  );

  // ====================
  // STEP RENDERERS
  // ====================

  function renderStepSpecialty() {
    return (
      <View style={{ flex: 1 }}>
        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeCategory === "medical" && styles.tabActive]}
            onPress={() => setActiveCategory("medical")}
          >
            <Text style={[styles.tabText, activeCategory === "medical" && styles.tabTextActive]}>
              Especialidades Med.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeCategory === "wellness" && styles.tabActive]}
            onPress={() => setActiveCategory("wellness")}
          >
            <Text style={[styles.tabText, activeCategory === "wellness" && styles.tabTextActive]}>
              Bem-estar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Specialties List */}
        <FlatList
          data={currentSpecialties}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.specialtyItem}
              onPress={() => handleSelectSpecialty(item)}
              activeOpacity={0.7}
            >
              <View style={styles.specialtyIconContainer}>
                <Ionicons
                  name={(item.icon_name as any) || "medical-outline"}
                  size={24}
                  color="#032FEA"
                />
              </View>
              <Text style={styles.specialtyName}>{item.speciality_name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma especialidade disponível</Text>
            </View>
          }
        />
      </View>
    );
  }

  function renderStepDate() {
    // In "byProfessional" mode and no professional selected yet: show professionals list
    if (scheduleMode === "byProfessional" && !selectedProfessionalName) {
      return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Mode Toggle */}
          {renderModeToggle()}

          <Text style={styles.sectionTitle}>PROFISSIONAIS DISPONÍVEIS</Text>

          {uniqueProfessionals.map((slot, index) => (
            <TouchableOpacity
              key={`${slot.professional_name}-${index}`}
              style={styles.professionalCard}
              onPress={() => handleSelectProfessionalFirst(slot.professional_name)}
              activeOpacity={0.7}
            >
              <View style={styles.professionalAvatar}>
                <Ionicons name="person-circle-outline" size={48} color="#032FEA" />
              </View>
              <View style={styles.professionalInfo}>
                <Text style={styles.professionalName}>{slot.professional_name || "Profissional"}</Text>
                {slot.professional_crm ? (
                  <Text style={styles.professionalCrm}>CRM: {slot.professional_crm}</Text>
                ) : null}
                <View style={styles.consultBadge}>
                  <Text style={styles.consultBadgeText}>Teleconsulta</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}

          {uniqueProfessionals.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum profissional disponível</Text>
            </View>
          )}
        </ScrollView>
      );
    }

    // Calendar view (byTime default, or byProfessional after selecting professional)
    const activeDatesSet = scheduleMode === "byProfessional" && selectedProfessionalName
      ? new Set(slotsForProfessional.dates_available)
      : datesAvailableSet;

    const calendarDaysForMode = (() => {
      const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
      const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days: Array<{
        day: number;
        dateStr: string;
        isAvailable: boolean;
        isPast: boolean;
        isEmpty: boolean;
      }> = [];

      for (let i = 0; i < firstDay; i++) {
        days.push({ day: 0, dateStr: "", isAvailable: false, isPast: false, isEmpty: true });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(calendarYear, calendarMonth, d);
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isPast = dateObj < today;
        const isAvailable = !isPast && activeDatesSet.has(dateStr);
        days.push({ day: d, dateStr, isAvailable, isPast, isEmpty: false });
      }

      return days;
    })();

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Mode Toggle */}
        {renderModeToggle()}

        {/* Professional banner if in byProfessional mode */}
        {scheduleMode === "byProfessional" && selectedProfessionalName && (
          <View style={styles.selectedDateBanner}>
            <Ionicons name="person" size={18} color="#032FEA" />
            <Text style={styles.selectedDateText}>{selectedProfessionalName}</Text>
            <TouchableOpacity onPress={() => { setSelectedProfessionalName(null); setSelectedDate(null); setSelectedTime(null); }}>
              <Text style={styles.changeDateLink}>Alterar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Subtitle */}
        <Text style={styles.stepSubtitle}>Selecione a data</Text>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[calendarMonth]} {calendarYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Day Names Header */}
        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map((name) => (
            <Text key={name} style={styles.dayNameText}>{name}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDaysForMode.map((item, index) => {
            if (item.isEmpty) {
              return <View key={`empty-${index}`} style={styles.calendarCell} />;
            }

            const isSelected = selectedDate === item.dateStr;
            const cellStyle = [
              styles.calendarCell,
              item.isAvailable && styles.calendarCellAvailable,
              isSelected && styles.calendarCellSelected,
              item.isPast && styles.calendarCellPast,
            ];
            const textStyle = [
              styles.calendarDayText,
              item.isAvailable && styles.calendarDayAvailable,
              isSelected && styles.calendarDaySelected,
              item.isPast && styles.calendarDayPast,
              !item.isAvailable && !item.isPast && styles.calendarDayUnavailable,
            ];

            return (
              <TouchableOpacity
                key={item.dateStr}
                style={cellStyle}
                disabled={!item.isAvailable}
                onPress={() => handleSelectDate(item.dateStr)}
                activeOpacity={0.7}
              >
                <Text style={textStyle}>{item.day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.nextButton, !selectedDate && styles.nextButtonDisabled]}
            disabled={!selectedDate}
            onPress={() => setCurrentStep("time")}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Próximo</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderModeToggle() {
    return (
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeToggleButton, scheduleMode === "byTime" && styles.modeToggleActive]}
          onPress={() => handleSwitchMode("byTime")}
        >
          <Ionicons name="time-outline" size={16} color={scheduleMode === "byTime" ? "#fff" : "#999"} />
          <Text style={[styles.modeToggleText, scheduleMode === "byTime" && styles.modeToggleTextActive]}>
            Por horário
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeToggleButton, scheduleMode === "byProfessional" && styles.modeToggleActive]}
          onPress={() => handleSwitchMode("byProfessional")}
        >
          <Ionicons name="person-outline" size={16} color={scheduleMode === "byProfessional" ? "#fff" : "#999"} />
          <Text style={[styles.modeToggleText, scheduleMode === "byProfessional" && styles.modeToggleTextActive]}>
            Por profissional
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderStepTime() {
    // In byProfessional mode, auto-select the slot when time is picked (professional already chosen)
    const handleTimeAndMaybeProceed = (time: string) => {
      handleSelectTime(time);
      if (scheduleMode === "byProfessional" && selectedProfessionalName) {
        // Auto-select the slot for this professional + date + time
        const sourceSlots = slotsForProfessional.slots;
        const match = sourceSlots.find(
          (s) => s.date === selectedDate && s.time === time
        );
        if (match) {
          setSelectedSlot(match);
        }
      }
    };

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Compact selected date display */}
        <View style={styles.selectedDateBanner}>
          <Ionicons name="calendar" size={18} color="#032FEA" />
          <Text style={styles.selectedDateText}>
            {selectedDate ? formatDateBR(selectedDate) : ""}
          </Text>
          <TouchableOpacity onPress={() => setCurrentStep("date")}>
            <Text style={styles.changeDateLink}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Professional banner in byProfessional mode */}
        {scheduleMode === "byProfessional" && selectedProfessionalName && (
          <View style={[styles.selectedDateBanner, { marginTop: 0 }]}>
            <Ionicons name="person" size={18} color="#032FEA" />
            <Text style={styles.selectedDateText}>{selectedProfessionalName}</Text>
          </View>
        )}

        {/* Times Grid */}
        <Text style={styles.sectionTitle}>HORÁRIOS DISPONÍVEIS</Text>

        <View style={styles.timesGrid}>
          {timesForSelectedDate.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                onPress={() => handleTimeAndMaybeProceed(time)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {timesForSelectedDate.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum horário disponível nesta data</Text>
          </View>
        )}

        {/* Next / Confirm Button */}
        <View style={styles.bottomAction}>
          {scheduleMode === "byProfessional" && selectedProfessionalName ? (
            <TouchableOpacity
              style={[styles.confirmButton, (!selectedTime || !selectedSlot) && styles.confirmButtonDisabled]}
              disabled={!selectedTime || !selectedSlot || loading}
              onPress={handleConfirmAppointment}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, !selectedTime && styles.nextButtonDisabled]}
              disabled={!selectedTime}
              onPress={() => setCurrentStep("professional")}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Próximo</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  function renderStepProfessional() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Date & Time Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>DATA DA CONSULTA</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={18} color="#032FEA" />
            <Text style={styles.summaryValue}>
              DATA E HORÁRIO: {selectedDate ? formatDateBR(selectedDate) : ""} - {selectedTime}
            </Text>
          </View>
        </View>

        {/* Professionals List */}
        <Text style={styles.sectionTitle}>PROFISSIONAIS DISPONÍVEIS</Text>
        <Text style={styles.sectionHint}>
          Toque no botão para conhecer mais sobre o profissional:
        </Text>

        {professionalsForSlot.map((slot, index) => {
          const isSelected = selectedSlot?.user_schedule_id === slot.user_schedule_id
            && selectedSlot?.professional_name === slot.professional_name;

          return (
            <TouchableOpacity
              key={`${slot.user_schedule_id}-${index}`}
              style={[styles.professionalCard, isSelected && styles.professionalCardSelected]}
              onPress={() => handleSelectProfessional(slot)}
              activeOpacity={0.7}
            >
              <View style={styles.professionalAvatar}>
                <Ionicons name="person-circle-outline" size={48} color="#032FEA" />
              </View>
              <View style={styles.professionalInfo}>
                <Text style={styles.professionalName}>{slot.professional_name || "Profissional"}</Text>
                {slot.professional_crm ? (
                  <Text style={styles.professionalCrm}>CRM: {slot.professional_crm}</Text>
                ) : null}
                <View style={styles.consultBadge}>
                  <Text style={styles.consultBadgeText}>Teleconsulta</Text>
                </View>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={28} color="#00E276" />
              )}
            </TouchableOpacity>
          );
        })}

        {professionalsForSlot.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum profissional disponível neste horário</Text>
          </View>
        )}

        {/* Confirm Button */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.confirmButton, !selectedSlot && styles.confirmButtonDisabled]}
            disabled={!selectedSlot || loading}
            onPress={handleConfirmAppointment}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

// ====================
// STYLES
// ====================
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    textAlign: "center",
    marginHorizontal: 8,
  },

  // ---- STEP 1: Specialties ----
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1a2347",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#032FEA",
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#999",
  },
  tabTextActive: {
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  specialtyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  specialtyName: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#1a1a1a",
  },

  // ---- Mode Toggle ----
  modeToggleContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1a2347",
    borderRadius: 12,
    padding: 4,
  },
  modeToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modeToggleActive: {
    backgroundColor: "#032FEA",
  },
  modeToggleText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#999",
  },
  modeToggleTextActive: {
    color: "#fff",
  },

  // ---- STEP 2: Calendar ----
  stepSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#fff",
    marginHorizontal: 16,
  },
  dayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dayNameText: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#999",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: CELL_SIZE / 2,
  },
  calendarCellAvailable: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  calendarCellSelected: {
    backgroundColor: "#032FEA",
  },
  calendarCellPast: {},
  calendarDayText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#fff",
  },
  calendarDayAvailable: {
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  calendarDaySelected: {
    color: "#fff",
    fontFamily: Fonts.bold,
  },
  calendarDayPast: {
    color: "#444",
  },
  calendarDayUnavailable: {
    color: "#555",
  },

  // ---- STEP 3: Time ----
  selectedDateBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2347",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  selectedDateText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
  changeDateLink: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#032FEA",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: "#999",
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 1,
  },
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  timeChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "transparent",
    minWidth: (SCREEN_WIDTH - 72) / 4,
    alignItems: "center",
  },
  timeChipSelected: {
    backgroundColor: "#032FEA",
    borderColor: "#032FEA",
  },
  timeChipText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#ccc",
  },
  timeChipTextSelected: {
    color: "#fff",
  },

  // ---- STEP 4: Professional ----
  summaryCard: {
    backgroundColor: "#1a2347",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: "#999",
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#999",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  professionalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2347",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  professionalCardSelected: {
    borderColor: "#00E276",
  },
  professionalAvatar: {
    marginRight: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#fff",
    marginBottom: 2,
  },
  professionalCrm: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#999",
    marginBottom: 6,
  },
  consultBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(3, 47, 234, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  consultBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: "#032FEA",
  },

  // ---- Shared ----
  bottomAction: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: "#032FEA",
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  confirmButton: {
    backgroundColor: "#00E276",
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999",
  },
});
