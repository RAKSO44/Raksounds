import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { SCALE_TYPES_BY_FAMILY, ScaleFamily, ScaleType } from '@/domain/music-theory';
import { GroupedOptionList } from '@/shared/design-system';

import { SUBTYPE_LABELS } from '../labels';

interface ScaleSubtypeSelectorProps {
  family: ScaleFamily;
  selected: ScaleType;
  onSelect: (type: ScaleType) => void;
}

/**
 * Segundo nivel del tipo: los subtipos de la familia activa, como lista
 * agrupada (jerarquía secundaria). Al cambiar de familia, el contenido se
 * renueva con una transición suave de altura y un fundido corto.
 */
export function ScaleSubtypeSelector({ family, selected, onSelect }: ScaleSubtypeSelectorProps) {
  const options = SCALE_TYPES_BY_FAMILY[family].map((type) => ({
    key: type,
    label: SUBTYPE_LABELS[type],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(200)}>
      <Animated.View key={family} entering={FadeIn.duration(160)}>
        <GroupedOptionList
          options={options}
          selectedKey={selected}
          onSelect={(key) => onSelect(key as ScaleType)}
        />
      </Animated.View>
    </Animated.View>
  );
}
