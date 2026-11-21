import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { FigureId, FIGURES, wholeDivisions } from '@/domain/rhythm';
import { controls, radii, spacing, typography, useTheme } from '@/shared/theme';

import { FigureTile } from '../notation/FigureTile';

interface FiguresTableProps {
  selected: FigureId | null;
  onSelect: (figure: FigureId) => void;
}

/**
 * Las cinco figuras, de la que más dura a la que menos: nombre, la figura
 * (se selecciona al tocarla, para ver su detalle) y su valor relativo,
 * tomando la redonda como la unidad. Mismo estilo que la tabla de las notas
 * (Módulo 1): columnas separadas, filas sin divisiones y todo centrado.
 */
export function FiguresTable({ selected, onSelect }: FiguresTableProps) {
  const { colors } = useTheme();
  const columnEdge = { borderRightColor: colors.border };

  return (
    <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.row, styles.headerRow, { borderBottomColor: colors.border }]}>
        <HeaderCell title="Nombre" style={[styles.nameColumn, columnEdge]} />
        <HeaderCell title="Figura" style={[styles.figureColumn, columnEdge]} />
        <HeaderCell title="Valor relativo" style={[styles.valueColumn, styles.lastCell]} />
      </View>

      {FIGURES.map((figure) => (
        <View key={figure.id} style={styles.row}>
          <View style={[styles.cell, styles.nameColumn, columnEdge]}>
            <Text style={[styles.text, { color: colors.textPrimary }]}>{figure.name}</Text>
          </View>
          <View style={[styles.cell, styles.figureColumn, columnEdge]}>
            <FigureTile
              figure={figure.id}
              space={controls.figureSpaceTile}
              active={selected === figure.id}
              accessibilityLabel={`Ver ${figure.name.toLowerCase()}`}
              onPressIn={() => onSelect(figure.id)}
            />
          </View>
          <View style={[styles.cell, styles.valueColumn, styles.lastCell]}>
            <Text style={[styles.text, { color: colors.brandText }]}>
              {relativeValue(wholeDivisions(figure))}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** "1 unidad", "1/2 unidad"…: la redonda es la unidad. */
function relativeValue(divisions: number): string {
  return divisions === 1 ? '1 unidad' : `1/${divisions} unidad`;
}

function HeaderCell({ title, style }: { title: string; style: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.cell, style]}>
      <Text style={[styles.headerText, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 2,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderBottomWidth: 2,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRightWidth: 2,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  // "Semicorchea" es la palabra más larga; la ficha de la figura cabe en menos.
  nameColumn: {
    flex: 1.2,
  },
  figureColumn: {
    flex: 0.8,
  },
  valueColumn: {
    flex: 1,
  },
  headerText: {
    ...typography.sectionLabel,
    flexShrink: 0,
    textAlign: 'center',
  },
  text: {
    ...typography.chip,
    flexShrink: 0,
    textAlign: 'center',
  },
});
