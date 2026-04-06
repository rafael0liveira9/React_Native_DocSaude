import telemedicinaService from "@/api/telemedicina";
import type { Specialty, Slot, SlotsResponse, Professional } from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
  const routeParams = useLocalSearchParams<{ pacienteId?: string; pacienteNome?: string }>();
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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
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
    // Usa pacienteId (pode ser dependente) ou fallback para user-id
    const id = routeParams.pacienteId || (await SecureStore.getItemAsync("user-id"));
    if (id) {
      const parsedId = parseInt(id);
      setUserId(parsedId);
      // Validar (gerar token Teladoc) para o paciente selecionado
      try {
        await telemedicinaService.validate(parsedId);
      } catch (e) {
        console.warn("[AGENDAR] Erro ao validar paciente, continuando...", e);
      }
      loadSpecialties(parsedId);
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
    setProfessionals([]);
    if (!userId) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // 1. Busca profissionais disponiveis (specialistSchedules)
      const specialistData = await telemedicinaService.getScheduleSlots(
        userId,
        specialty.speciality_id ?? undefined,
        specialty.occupation_id ?? undefined,
        today,
        30,
        specialty.program_id,
        'specialistSchedules'
      );

      if (specialistData.professionals) {
        setProfessionals(specialistData.professionals);
      }

      // 2. Busca dias disponiveis no calendario (daysProgramCalendar)
      const calendarData = await telemedicinaService.getScheduleSlots(
        userId,
        specialty.speciality_id ?? undefined,
        specialty.occupation_id ?? undefined,
        today,
        30,
        specialty.program_id,
        'daysProgramCalendar'
      );

      setSlotsData({
        dates_available: calendarData.dates_available,
        slots: [],
      });
      setCurrentStep("date");
    } catch (error) {
      console.error("Erro ao carregar slots:", error);
      Toast.show({ type: "error", text1: "Erro ao buscar horários disponíveis" });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = (mode: ScheduleMode) => {
    if (mode === scheduleMode) return;
    setScheduleMode(mode);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlot(null);
    setSelectedProfessionalName(null);
  };

  // List of unique professionals for "by professional" mode
  const uniqueProfessionals = useMemo(() => {
    return professionals.map(prof => ({
      date: '',
      time: '',
      timestamp: 0,
      user_schedule_id: prof.schedule_id,
      user_id: prof.user_id,
      professional_name: prof.professional_name,
      professional_crm: prof.professional_crm,
      double_booking: false,
    } as Slot));
  }, [professionals]);

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

  const handleSelectDate = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSelectedSlot(null);

    if (userId && selectedSpecialty && professionals.length > 0) {
      try {
        setLoading(true);

        // Busca slots reais para cada profissional disponivel
        const allSlots: Slot[] = [];
        const schedulesToFetch = scheduleMode === "byProfessional" && selectedProfessionalName
          ? professionals.filter(p => p.professional_name === selectedProfessionalName)
          : professionals;

        for (const prof of schedulesToFetch) {
          const realSlots = await telemedicinaService.getSlotsByDate(
            userId,
            dateStr,
            selectedSpecialty.program_id,
            selectedSpecialty.speciality_id ?? undefined,
            selectedSpecialty.occupation_id ?? undefined,
            prof.schedule_id
          );
          // Enrich slots with professional info
          const enrichedSlots = realSlots.slots.map(slot => ({
            ...slot,
            professional_name: slot.professional_name || prof.professional_name,
            professional_crm: slot.professional_crm || prof.professional_crm,
            user_id: slot.user_id || prof.user_id,
          }));
          allSlots.push(...enrichedSlots);
        }

        setSlotsData((prev) => {
          const otherDateSlots = prev.slots.filter((s) => s.date !== dateStr);
          return {
            dates_available: prev.dates_available,
            slots: [...otherDateSlots, ...allSlots],
          };
        });
      } catch (error) {
        console.error("Erro ao carregar horários do dia:", error);
        Toast.show({ type: "error", text1: "Erro ao buscar horários do dia" });
      } finally {
        setLoading(false);
      }
    }
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
    const filtered = slotsData.slots.filter(
      (s) => s.date === selectedDate && s.time === selectedTime
    );
    // Deduplica por professional_name (scheduleUserCalendar pode retornar arrays duplicados)
    const seen = new Set<string>();
    return filtered.filter((s) => {
      const key = s.professional_name || String(s.user_schedule_id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedDate, selectedTime, slotsData.slots]);

  // Se só tem um profissional disponível, já seleciona automaticamente
  useEffect(() => {
    if (professionalsForSlot.length === 1) {
      setSelectedSlot(professionalsForSlot[0]);
    }
  }, [professionalsForSlot]);

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
        userId: selectedSlot.user_id,
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
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.error || "";

      if (errorCode === "MAX_ATTENDANCES" || errorMsg.includes("limite")) {
        // Busca atendimento ativo na Teladoc para oferecer cancelamento
        Alert.alert(
          "Consulta ativa encontrada",
          "Você já possui uma consulta agendada neste programa. Deseja cancelar a consulta anterior para agendar uma nova?",
          [
            { text: "Não", style: "cancel" },
            {
              text: "Sim, cancelar anterior",
              style: "destructive",
              onPress: async () => {
                try {
                  setLoading(true);
                  const activeList = await telemedicinaService.getTeladocActiveAttendances(userId!);
                  if (activeList.length > 0) {
                    const active = activeList[0];
                    await telemedicinaService.cancelAppointment(
                      userId!,
                      active.case_attendance_id
                    );
                    Toast.show({
                      type: "success",
                      text1: "Consulta anterior cancelada",
                      text2: "Tente agendar novamente.",
                    });
                  } else {
                    Toast.show({
                      type: "info",
                      text1: "Nenhuma consulta ativa encontrada na Teladoc",
                      text2: "Tente agendar novamente em alguns instantes.",
                    });
                  }
                } catch (cancelError) {
                  console.error("Erro ao cancelar consulta anterior:", cancelError);
                  Toast.show({ type: "error", text1: "Erro ao cancelar consulta anterior" });
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Erro ao agendar",
          errorMsg || "Não foi possível confirmar o agendamento. Tente novamente."
        );
      }
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
        <Pressable style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: themeColors.text }]} numberOfLines={1}>
          {currentStep === "specialty" && "Selecione a especialidade"}
          {currentStep === "date" && (selectedSpecialty?.speciality_name || "Agendar Consulta")}
          {currentStep === "time" && (selectedSpecialty?.speciality_name || "Escolha o horário")}
          {currentStep === "professional" && "Escolher profissional"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Banner do paciente */}
      {routeParams.pacienteNome && (
        <View style={styles.pacienteBanner}>
          <Ionicons name="person" size={16} color="#032FEA" />
          <Text style={styles.pacienteBannerText}>
            Agendando para {routeParams.pacienteNome.split(" ")[0]}
          </Text>
        </View>
      )}

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
          <Pressable
            style={[styles.tab, activeCategory === "medical" && styles.tabActive]}
            onPress={() => setActiveCategory("medical")}
          >
            <Text style={[styles.tabText, activeCategory === "medical" && styles.tabTextActive]}>
              Especialidades Med.
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeCategory === "wellness" && styles.tabActive]}
            onPress={() => setActiveCategory("wellness")}
          >
            <Text style={[styles.tabText, activeCategory === "wellness" && styles.tabTextActive]}>
              Bem-estar
            </Text>
          </Pressable>
        </View>

        {/* Specialties List */}
        <FlatList
          data={currentSpecialties}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Pressable
              style={styles.specialtyItem}
              onPress={() => handleSelectSpecialty(item)}
  
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
            </Pressable>
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
            <Pressable
              key={`${slot.professional_name}-${index}`}
              style={styles.professionalCard}
              onPress={() => handleSelectProfessionalFirst(slot.professional_name)}
  
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
            </Pressable>
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
    // Usar datas globais em ambos os modos - os slots do profissional só são
    // carregados ao selecionar uma data, então slotsForProfessional estaria vazio aqui
    const activeDatesSet = datesAvailableSet;

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
            <Pressable onPress={() => { setSelectedProfessionalName(null); setSelectedDate(null); setSelectedTime(null); }}>
              <Text style={styles.changeDateLink}>Alterar</Text>
            </Pressable>
          </View>
        )}

        {/* Subtitle */}
        <Text style={styles.stepSubtitle}>Selecione a data</Text>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={goToPrevMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[calendarMonth]} {calendarYear}
          </Text>
          <Pressable onPress={goToNextMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
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
              <Pressable
                key={item.dateStr}
                style={cellStyle}
                disabled={!item.isAvailable}
                onPress={() => handleSelectDate(item.dateStr)}
    
              >
                <Text style={textStyle}>{item.day}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Next Button */}
        <View style={styles.bottomAction}>
          <Pressable
            style={[styles.nextButton, !selectedDate && styles.nextButtonDisabled]}
            disabled={!selectedDate}
            onPress={() => setCurrentStep("time")}

          >
            <Text style={styles.nextButtonText}>Próximo</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  function renderModeToggle() {
    return (
      <View style={styles.modeToggleContainer}>
        <Pressable
          style={[styles.modeToggleButton, scheduleMode === "byTime" && styles.modeToggleActive]}
          onPress={() => handleSwitchMode("byTime")}
        >
          <Ionicons name="time-outline" size={16} color={scheduleMode === "byTime" ? "#fff" : "#999"} />
          <Text style={[styles.modeToggleText, scheduleMode === "byTime" && styles.modeToggleTextActive]}>
            Por horário
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeToggleButton, scheduleMode === "byProfessional" && styles.modeToggleActive]}
          onPress={() => handleSwitchMode("byProfessional")}
        >
          <Ionicons name="person-outline" size={16} color={scheduleMode === "byProfessional" ? "#fff" : "#999"} />
          <Text style={[styles.modeToggleText, scheduleMode === "byProfessional" && styles.modeToggleTextActive]}>
            Por profissional
          </Text>
        </Pressable>
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
          <Pressable onPress={() => setCurrentStep("date")}>
            <Text style={styles.changeDateLink}>Alterar</Text>
          </Pressable>
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
              <Pressable
                key={time}
                style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                onPress={() => handleTimeAndMaybeProceed(time)}
    
              >
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                  {time}
                </Text>
              </Pressable>
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
            <Pressable
              style={[styles.confirmButton, (!selectedTime || !selectedSlot) && styles.confirmButtonDisabled]}
              disabled={!selectedTime || !selectedSlot || loading}
              onPress={handleConfirmAppointment}
  
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={[styles.nextButton, !selectedTime && styles.nextButtonDisabled]}
              disabled={!selectedTime}
              onPress={() => setCurrentStep("professional")}
  
            >
              <Text style={styles.nextButtonText}>Próximo</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
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
            <Pressable
              key={`${slot.user_schedule_id}-${index}`}
              style={[styles.professionalCard, isSelected && styles.professionalCardSelected]}
              onPress={() => handleSelectProfessional(slot)}
  
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
            </Pressable>
          );
        })}

        {professionalsForSlot.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum profissional disponível neste horário</Text>
          </View>
        )}

        {/* Confirm Button */}
        <View style={styles.bottomAction}>
          <Pressable
            style={[styles.confirmButton, !selectedSlot && styles.confirmButtonDisabled]}
            disabled={!selectedSlot || loading}
            onPress={handleConfirmAppointment}

          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
            )}
          </Pressable>
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
  pacienteBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EEFF",
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginBottom: 4,
  },
  pacienteBannerText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#032FEA",
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
