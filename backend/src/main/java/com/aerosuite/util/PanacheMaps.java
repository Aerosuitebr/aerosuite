package com.aerosuite.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/** Helpers para indexar listas carregadas via Panache (PanacheEntityBase). */
public final class PanacheMaps {

    private PanacheMaps() {}

    public static <T, K> Map<K, T> byId(List<T> entities, Function<T, K> idGetter) {
        if (entities == null || entities.isEmpty()) {
            return Map.of();
        }
        Map<K, T> map = new HashMap<>();
        for (T entity : entities) {
            K id = idGetter.apply(entity);
            if (id != null) {
                map.putIfAbsent(id, entity);
            }
        }
        return map;
    }
}
