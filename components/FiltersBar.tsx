import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

  cities: string[];
  isSearching?: boolean;
};

export function FiltersBar({
  query,
  onQueryChange,
  city,
  onCityChange,
  onlyDiscounts,
  onToggleDiscounts,
  cities,
  isSearching = false,
}: Props) {
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const cityLabel = useMemo(() => city ?? "Todas", [city]);

  const selectCity = (c: string | null) => {
    onCityChange(c);
    setCityModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="¿Qué plato estás buscando?"
          value={query}
          onChangeText={onQueryChange}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {isSearching && (
          <ActivityIndicator
            size="small"
            color="#FF6A00"
            style={styles.spinner}
          />
        )}
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.citySelector}
          onPress={() => setCityModalOpen(true)}
        >
          <Text style={styles.cityText}>📍 {cityLabel} ▾</Text>
        </Pressable>

        <Pressable
          style={[styles.discount, onlyDiscounts && styles.discountActive]}
          onPress={onToggleDiscounts}
        >
          <Text style={onlyDiscounts ? styles.textActive : styles.text}>
            💸 Descuento
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={cityModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModalOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setCityModalOpen(false)}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Selecciona ciudad ({cities.length})
              </Text>
              <Pressable onPress={() => setCityModalOpen(false)} hitSlop={10}>
                <Text style={styles.sheetClose}>Cerrar</Text>
              </Pressable>
            </View>

            <FlatList
              data={[null, ...cities]}
              keyExtractor={(item) => item ?? "__all__"}
              showsVerticalScrollIndicator
              contentContainerStyle={{ gap: 6, paddingBottom: 30 }}
              renderItem={({ item: c }) => {
                const active = city === c;
                return (
                  <Pressable
                    style={[styles.cityItem, active && styles.cityItemActive]}
                    onPress={() => selectCity(c)}
                  >
                    <Text
                      style={active ? styles.cityActiveText : styles.cityItemText}
                    >
                      {c ?? "Todas las ciudades"}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, gap: 10 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  spinner: { marginRight: 10 },

  row: { flexDirection: "row", gap: 8 },

  citySelector: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
  },
  cityText: { fontSize: 14, fontWeight: "500" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  sheetClose: { fontSize: 13, fontWeight: "600", color: "#FF6A00" },

  cityItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  cityItemActive: { backgroundColor: "#FF6A00" },
  cityItemText: { fontSize: 14, color: "#111", fontWeight: "500" },
  cityActiveText: { fontSize: 14, color: "#fff", fontWeight: "700" },

  discount: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },
  discountActive: { backgroundColor: "#000" },
  text: { fontSize: 13, color: "#000" },
  textActive: { fontSize: 13, color: "#fff", fontWeight: "600" },
});
