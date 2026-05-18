import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;

  city: string | null;
  onCityChange: (city: string | null) => void;

  onlyDiscounts: boolean;
  onToggleDiscounts: () => void;
};

const cities = ["Medellín", "Bogotá", "Sincelejo"];

export function FiltersBar({
  query,
  onQueryChange,
  city,
  onCityChange,
  onlyDiscounts,
  onToggleDiscounts,
}: Props) {
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const cityLabel = useMemo(() => {
    return city ?? "Todas";
  }, [city]);

  const selectCity = (c: string | null) => {
    onCityChange(c);
    setCityModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Buscar plato */}
      <TextInput
        placeholder="¿Qué plato estás buscando?"
        value={query}
        onChangeText={onQueryChange}
        style={styles.input}
        returnKeyType="search"
      />

      {/* Selector ciudad (abre modal) */}
      <Pressable
        style={styles.citySelector}
        onPress={() => setCityModalOpen(true)}
      >
        <Text style={styles.cityText}>Ciudad: {cityLabel} ▾</Text>
      </Pressable>

      {/* Modal de ciudades */}
      <Modal
        visible={cityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalOpen(false)}
      >
        {/* Backdrop: tocar fuera cierra */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setCityModalOpen(false)}
        >
          {/* Sheet */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Selecciona ciudad</Text>
              <Pressable onPress={() => setCityModalOpen(false)} hitSlop={10}>
                <Text style={styles.sheetClose}>Cerrar</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.cityItem, city === null && styles.cityItemActive]}
              onPress={() => selectCity(null)}
            >
              <Text style={city === null ? styles.cityActiveText : styles.cityItemText}>
                Todas
              </Text>
            </Pressable>

            {cities.map((c) => {
              const active = city === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.cityItem, active && styles.cityItemActive]}
                  onPress={() => selectCity(c)}
                >
                  <Text style={active ? styles.cityActiveText : styles.cityItemText}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Descuento */}
      <Pressable
        style={[styles.discount, onlyDiscounts && styles.discountActive]}
        onPress={onToggleDiscounts}
      >
        <Text style={onlyDiscounts ? styles.textActive : styles.text}>
          💸 Descuento
        </Text>
      </Pressable>

      {/* Nota técnica:
          onlyDiscounts hoy NO filtra en Home porque BackendDish no trae flag de descuento.
          En el PASO 3 lo alineamos (o lo ocultamos si aún no aplica). */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 10,
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  citySelector: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
  },
  cityText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sheetClose: {
    fontSize: 13,
    fontWeight: "600",
  },

  cityItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  cityItemActive: {
    backgroundColor: "#000",
  },
  cityItemText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  cityActiveText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },

  // Discount chip
  discount: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  discountActive: {
    backgroundColor: "#000",
  },
  text: {
    fontSize: 13,
    color: "#000",
  },
  textActive: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
});


