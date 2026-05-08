import { Stack } from "expo-router";

export default function StackLayout() {
  return <StackLayoutContent />;
}

function StackLayoutContent() {
  return (
    <Stack>
      <Stack.Screen
        name="accredited/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="example/index"
        options={{
          title: "Página Exemplo",
        }}
      />
      <Stack.Screen
        name="telemedicina"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="telemedicina-web/index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
