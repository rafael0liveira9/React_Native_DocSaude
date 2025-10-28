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
          title: "Rede Credenciada",
          headerTitleStyle: {
            fontSize: 22,
          },
        }}
      />
      <Stack.Screen
        name="example/index"
        options={{
          title: "Página Exemplo",
        }}
      />
    </Stack>
  );
}
